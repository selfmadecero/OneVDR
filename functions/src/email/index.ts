import * as functions from 'firebase-functions';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  functions.config().gmail.client_id,
  functions.config().gmail.client_secret,
  functions.config().gmail.redirect_uri
);

export const getGmailMessages = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { accessToken } = data;
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
      });

      const messages = response.data.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (message: any) => {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
          });
          return parseEmailDetails(details.data);
        })
      );

      return emailDetails;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error fetching Gmail messages',
        error instanceof Error ? error.message : 'Unknown error occurred'
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
