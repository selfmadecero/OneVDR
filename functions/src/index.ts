import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { PDFExtract } from 'pdf.js-extract';

admin.initializeApp();

const API_KEY = functions.config().openai.api_key;
const API_URL = 'https://api.openai.com/v1/chat/completions';

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
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.post(
        API_URL,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert document analyst with deep knowledge across various domains. Your task is to analyze the given document comprehensively and accurately.',
            },
            {
              role: 'user',
              content: `Analyze the following document titled "${fileName}" and provide a detailed analysis:\n\n${text}`,
            },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retries * 2)
            );
            continue;
          }
        } else {
          console.error('OpenAI API error:', error.response?.data);
          throw new functions.https.HttpsError(
            'internal',
            `OpenAI API error: ${error.response?.status}`
          );
        }
      }
      throw new functions.https.HttpsError(
        'internal',
        'Unknown error occurred'
      );
    }
  }
  throw new functions.https.HttpsError(
    'resource-exhausted',
    'Max retries reached'
  );
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

    try {
      const text = await extractTextFromPDF(file);
      const analysis = await analyzeTextWithOpenAI(text, object.name);

      const userFiles = await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('files')
        .where('name', '==', object.name)
        .get();

      if (!userFiles.empty) {
        const fileDoc = userFiles.docs[0];
        await fileDoc.ref.update({
          analysis,
          analysisTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      throw new functions.https.HttpsError('internal', 'Error analyzing PDF');
    }
  });

export const analyzeDocument = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { filePath } = data;
  const userId = context.auth.uid;
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  try {
    const text = await extractTextFromPDF(file);
    const analysis = await analyzeTextWithOpenAI(
      text,
      filePath.split('/').pop() || 'Unknown'
    );

    const analysisPath = filePath.split('/').pop();
    if (!analysisPath) throw new Error('Invalid file path');

    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('files')
      .doc(analysisPath)
      .set(
        {
          analysis,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return analysis;
  } catch (error) {
    console.error('Error analyzing document:', error);
    if (error instanceof Error) {
      throw new functions.https.HttpsError(
        'internal',
        `Error analyzing document: ${error.message}`
      );
    } else {
      throw new functions.https.HttpsError(
        'internal',
        'Unknown error occurred while analyzing document'
      );
    }
  }
});
