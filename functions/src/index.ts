import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { PDFExtract } from 'pdf.js-extract';
import * as cors from 'cors';

admin.initializeApp();

const API_KEY = functions.config().openai.api_key;
const API_URL = 'https://api.openai.com/v1/chat/completions';

const corsHandler = cors({ origin: true });

async function extractTextFromPDF(file: any): Promise<string> {
  const [fileContents] = await file.download();
  const pdfExtract = new PDFExtract();
  const data = await pdfExtract.extractBuffer(fileContents);
  return data.pages.map((page) => page.content).join(' ');
}

async function analyzeTextWithOpenAI(
  text: string,
  fileName: string
): Promise<string> {
  const maxTokens = 8000;
  const chunks = splitTextIntoChunks(text, maxTokens);
  let fullAnalysis = [];

  for (const chunk of chunks) {
    try {
      const response = await axios.post(
        API_URL,
        {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert document analyst with deep knowledge across various domains. Your task is to analyze the given document comprehensively and accurately.',
            },
            {
              role: 'user',
              content: `Analyze the following part of the document titled "${fileName}":\n\n${chunk}`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'document_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'string',
                    description:
                      'A general summary of the document in 3-5 sentences',
                  },
                  keywords: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        word: { type: 'string' },
                        explanation: { type: 'string' },
                      },
                      required: ['word', 'explanation'],
                      additionalProperties: false,
                    },
                    description:
                      '5-7 most important keywords or phrases with explanations',
                  },
                  categories: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '2-3 main categories that best describe the document content',
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '5-7 related tags for indexing or searching the document',
                  },
                  keyInsights: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '3-5 key insights or points derived from the document',
                  },
                  toneAndStyle: {
                    type: 'string',
                    description:
                      "A brief description of the document's tone and style",
                  },
                  targetAudience: {
                    type: 'string',
                    description:
                      'Identification of the expected target audience for this document',
                  },
                  potentialApplications: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '2-3 potential applications or use cases for the information in this document',
                  },
                },
                required: [
                  'summary',
                  'keywords',
                  'categories',
                  'tags',
                  'keyInsights',
                  'toneAndStyle',
                  'targetAudience',
                  'potentialApplications',
                ],
                additionalProperties: false,
              },
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const analysisResult = response.data.choices[0].message.content;
      fullAnalysis.push(JSON.parse(analysisResult));
    } catch (error) {
      console.error('Error in analyzeTextWithOpenAI:', error);
      if (axios.isAxiosError(error)) {
        console.error('OpenAI API error:', error.response?.data);
        throw new functions.https.HttpsError(
          'internal',
          `OpenAI API error: ${error.response?.status} - ${
            error.response?.data?.error?.message || 'Unknown error'
          }`
        );
      }
      throw new functions.https.HttpsError(
        'internal',
        'Unknown error occurred in analyzeTextWithOpenAI'
      );
    }
  }

  return JSON.stringify(mergeAnalysisResults(fullAnalysis));
}

function mergeAnalysisResults(results: any[]): any {
  if (results.length === 0) return {};
  if (results.length === 1) return results[0];

  const merged = { ...results[0] };
  for (let i = 1; i < results.length; i++) {
    merged.summary += ' ' + results[i].summary;
    merged.keywords = [...merged.keywords, ...results[i].keywords];
    merged.categories = [
      ...new Set([...merged.categories, ...results[i].categories]),
    ];
    merged.tags = [...new Set([...merged.tags, ...results[i].tags])];
    merged.keyInsights = [...merged.keyInsights, ...results[i].keyInsights];
    merged.potentialApplications = [
      ...new Set([
        ...merged.potentialApplications,
        ...results[i].potentialApplications,
      ]),
    ];
  }

  // Limit the number of items in each array
  merged.keywords = merged.keywords.slice(0, 7);
  merged.categories = merged.categories.slice(0, 3);
  merged.tags = merged.tags.slice(0, 7);
  merged.keyInsights = merged.keyInsights.slice(0, 5);
  merged.potentialApplications = merged.potentialApplications.slice(0, 3);

  return merged;
}

function splitTextIntoChunks(text: string, maxTokens: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + word).length > maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += word + ' ';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function analyzePDFCommon(
  file: any,
  fileName: string,
  userId: string
): Promise<string> {
  try {
    const text = await extractTextFromPDF(file);
    const analysis = await analyzeTextWithOpenAI(text, fileName);

    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('files')
      .doc(fileName)
      .set(
        {
          analysis,
          analysisTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return analysis;
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    if (error instanceof Error) {
      throw new functions.https.HttpsError(
        'internal',
        `Error analyzing PDF: ${error.message}`
      );
    } else {
      throw new functions.https.HttpsError(
        'internal',
        'Unknown error occurred while analyzing PDF'
      );
    }
  }
}

export const analyzePDF = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name) {
      console.error('File path is undefined');
      return null;
    }

    const filePath = object.name;
    const userId = filePath.split('/')[1];
    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);

    await analyzePDFCommon(
      file,
      object.name.split('/').pop() || 'Unknown',
      userId
    );
    return null;
  });

export const analyzeDocument = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      if (!request.body || !request.body.filePath) {
        response.status(400).send('Bad Request: Missing filePath');
        return;
      }

      const { filePath } = request.body;
      const userId = request.body.userId;
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);

      const fileName = filePath.split('/').pop() || 'Unknown';
      try {
        const analysis = await analyzePDFCommon(file, fileName, userId);
        response.status(200).json(JSON.parse(analysis));
      } catch (error) {
        console.error('Error in analyzeDocument:', error);
        response.status(500).json({
          error: 'Internal Server Error',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    });
  });
