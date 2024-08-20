import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const shareFile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const { fileId, recipientEmail, expirationDays, downloadable, requireNDA } =
    data;
  // 공유 링크 생성
  const shareId = crypto.randomBytes(16).toString('hex');
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  // Firestore에 공유 정보 저장
  const shareData = {
    fileId,
    shareId,
    recipientEmail,
    expirationDate,
    downloadable,
    requireNDA,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await admin.firestore().collection('shares').doc(shareId).set(shareData);
  // 공유 링크 생성
  const shareLink = `https://${process.env.FIREBASE_PROJECT_ID}.web.app/share/${shareId}`;
  // TODO: 이메일 전송 로직 구현
  return {
    success: true,
    message: 'File shared successfully',
    shareLink,
  };
});
