import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { FileInfo, AnalysisResult } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: 'onevdr-50b2f.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const addFileInfo = async (userId: string, fileInfo: FileInfo) => {
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileInfo.name);
    let analysis: AnalysisResult;

    if (typeof fileInfo.analysis === 'string') {
      if (fileInfo.analysis === '') {
        analysis = {
          summary: '',
          keywords: [],
          categories: [],
          tags: [],
          keyInsights: [],
          toneAndStyle: '',
          targetAudience: '',
          potentialApplications: [],
        };
      } else {
        try {
          analysis = JSON.parse(fileInfo.analysis);
        } catch (error) {
          console.error('Error parsing analysis JSON:', error);
          analysis = {
            summary: 'Error parsing analysis',
            keywords: [],
            categories: [],
            tags: [],
            keyInsights: [],
            toneAndStyle: '',
            targetAudience: '',
            potentialApplications: [],
          };
        }
      }
    } else {
      analysis = fileInfo.analysis;
    }

    const structuredData = {
      ...fileInfo,
      analysis,
    };

    await setDoc(fileRef, structuredData);
  } catch (error) {
    console.error('Error adding file info to Firestore:', error);
    throw error;
  }
};
