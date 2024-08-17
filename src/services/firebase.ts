import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { FileInfo } from '../types';

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

export const addFileInfo = async (userId: string, fileInfo: FileInfo) => {
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileInfo.name);
    await setDoc(fileRef, fileInfo);
  } catch (error) {
    console.error('Error adding file info to Firestore:', error);
    throw error;
  }
};
