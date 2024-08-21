import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

const oauth2Client = new google.auth.OAuth2(
  functions.config().gmail.client_id,
  functions.config().gmail.client_secret,
  functions.config().gmail.redirect_uri
);

export const getGmailMessages = functions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
      if (!request.headers.authorization) {
        response.status(401).send('Unauthorized');
        return;
      }

      const { accessToken } = request.body;
      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      try {
        const gmailResponse = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 10,
        });

        const messages = gmailResponse.data.messages || [];
        const emailDetails = await Promise.all(
          messages.map(async (message: any) => {
            const details = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
            });
            return parseEmailDetails(details.data);
          })
        );

        response.json(emailDetails);
      } catch (error) {
        console.error('Error fetching Gmail messages:', error);
        response.status(500).json({
          error: 'Internal Server Error',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    });
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
