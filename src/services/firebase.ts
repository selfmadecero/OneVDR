import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { FileInfo, AnalysisResult } from '../types';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: 'onevdr-50b2f.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const addFileInfo = async (userId: string, fileInfo: FileInfo) => {
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileInfo.name);
    const analysis: AnalysisResult = JSON.parse(fileInfo.analysis as string);

    const structuredData = {
      id: fileInfo.id,
      name: fileInfo.name,
      size: fileInfo.size,
      status: fileInfo.status,
      uploadDate: fileInfo.uploadDate,
      uploadProgress: fileInfo.uploadProgress,
      url: fileInfo.url,
      analysis: {
        summary: analysis.summary,
        keywords: analysis.keywords,
        categories: analysis.categories,
        tags: analysis.tags,
        keyInsights: analysis.keyInsights,
        toneAndStyle: analysis.toneAndStyle,
        targetAudience: analysis.targetAudience,
        potentialApplications: analysis.potentialApplications,
      },
    };

    await setDoc(fileRef, structuredData);
  } catch (error) {
    console.error('Error adding file info to Firestore:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};
