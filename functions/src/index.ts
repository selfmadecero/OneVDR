import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

const API_KEY = functions.config().openai.apikey;
const API_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions';

export const analyzePDF = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name) {
      console.error('File path is undefined');
      return null;
    }

    const filePath = object.name;
    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);

    // Get the download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    try {
      const response = await axios.post(
        API_URL,
        {
          prompt: `Analyze the PDF at ${url}:\n\nAnalysis:`,
          max_tokens: 200,
          n: 1,
          stop: null,
          temperature: 0.5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const analysis = response.data.choices[0].text.trim();

      // Store the analysis in Firestore
      await admin.firestore().collection('analyses').doc(filePath).set({
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      throw new functions.https.HttpsError('internal', 'Error analyzing PDF');
    }
  });
