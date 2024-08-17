import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { PDFExtract } from 'pdf.js-extract';

admin.initializeApp();

const API_KEY = functions.config().openai.apikey;
const API_URL = 'https://api.openai.com/v1/chat/completions';

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

    // Get the download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    try {
      // Extract text from PDF
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extract(url);
      const text = data.pages.map((page) => page.content).join(' ');

      // Call OpenAI API
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
              content: `Analyze the following document titled "${object.name}" and provide a detailed analysis:\n\n${text}`,
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
                    description: '문서의 일반적인 요약 (3-5문장)',
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
                      '설명이 포함된 5-7개의 가장 중요한 키워드 또는 구문',
                  },
                  categories: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '문서 내용을 가장 잘 설명하는 2-3개의 주요 카테고리',
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '문서 색인 또는 검색을 위한 5-7개의 관련 태그',
                  },
                  keyInsights: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '문서에서 도출된 3-5개의 주요 통찰 또는 요점',
                  },
                  toneAndStyle: {
                    type: 'string',
                    description: '문서의 어조와 스타일에 대한 간단한 설명',
                  },
                  targetAudience: {
                    type: 'string',
                    description: '이 문서의 예상 대상 독자 식별',
                  },
                  potentialApplications: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      '이 문서의 정보에 대한 2-3가지 잠재적 응용 또는 사용 사례',
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

      const analysis = JSON.parse(response.data.choices[0].message.content);

      // Find the corresponding document in Firestore and update it
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
