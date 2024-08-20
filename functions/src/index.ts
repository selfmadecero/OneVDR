import * as cors from 'cors';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { analyzePDFCommon } from './pdf';
import { shareFile } from './shareFile';

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const analyzeDocument = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
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
        response.status(200).json(analysis);
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

export { shareFile };
