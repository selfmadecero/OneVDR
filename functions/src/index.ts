import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { PDFExtract } from 'pdf.js-extract';

admin.initializeApp();

const API_KEY = process.env.OPENAI_API_KEY;
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
      console.log('Starting PDF text extraction...');
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extract(url);
      console.log(
        'PDF extraction completed. Number of pages:',
        data.pages.length
      );
      const text = data.pages.map((page) => page.content).join(' ');
      console.log(
        'Extracted text from PDF (first 500 characters):',
        text.substring(0, 500) + '...'
      );

      // Call OpenAI API
      console.log('Preparing OpenAI API call...');
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
            type: 'json_object',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      console.log('OpenAI API response received');

      console.log(
        'Raw OpenAI API response:',
        JSON.stringify(response.data, null, 2)
      );
      const analysis = response.data.choices[0].message.content;
      console.log('Parsed OpenAI API response:', analysis);

      // Find the corresponding document in Firestore and update it
      console.log('Updating Firestore document...');
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
        console.log('Firestore document updated successfully');
      } else {
        console.log('No matching Firestore document found for update');
      }

      return null;
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('OpenAI API error response:', error.response.data);
      }
      throw new functions.https.HttpsError('internal', 'Error analyzing PDF');
    }
  });
