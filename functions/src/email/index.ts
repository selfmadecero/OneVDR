import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import * as admin from 'firebase-admin';

admin.initializeApp();

const logError = (error: any) => {
  console.error('Detailed error:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
};

const oauth2Client = new google.auth.OAuth2(
  functions.config().gmail?.client_id,
  functions.config().gmail?.client_secret,
  functions.config().gmail?.redirect_uri
);

export const getGmailMessages = functions.https.onCall(
  async (data, context) => {
    console.log('getGmailMessages function called');
    if (!context.auth) {
      console.log('User not authenticated');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      console.log('Verifying ID token');
      const { idToken } = data;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      console.log('Getting OAuth2 tokens');
      const tokens = await admin
        .auth()
        .getUser(uid)
        .then((userRecord) => {
          const providerData = userRecord.providerData.find(
            (provider) => provider.providerId === 'google.com'
          );
          if (!providerData) {
            throw new Error('User is not authenticated with Google');
          }
          return providerData.toJSON();
        });

      console.log('Setting OAuth2 credentials');
      oauth2Client.setCredentials({
        access_token: (tokens as any).accessToken,
        refresh_token: (tokens as any).refreshToken,
      });

      console.log('Initializing Gmail API');
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      console.log('Fetching Gmail messages');
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
      });

      const messages = response.data.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (message) => {
          if (message.id) {
            const details = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
            });
            return parseEmailDetails(details.data);
          }
          return null;
        })
      );

      return emailDetails.filter((detail) => detail !== null);
    } catch (error) {
      logError(error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch Gmail messages: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
);

function parseEmailDetails(message: any) {
  const headers = message.payload.headers;
  const subject =
    headers.find((header: any) => header.name === 'Subject')?.value || '';
  const from =
    headers.find((header: any) => header.name === 'From')?.value || '';
  const to = headers.find((header: any) => header.name === 'To')?.value || '';
  const date =
    headers.find((header: any) => header.name === 'Date')?.value || '';

  let body = '';
  if (message.payload.parts) {
    body =
      message.payload.parts.find((part: any) => part.mimeType === 'text/plain')
        ?.body?.data || '';
  } else if (message.payload.body.data) {
    body = message.payload.body.data;
  }

  body = Buffer.from(body, 'base64').toString();

  return {
    id: message.id,
    subject,
    from,
    to,
    date,
    body,
  };
}
