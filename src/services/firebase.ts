import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBntmpXWx2bUasir7IU_TvYZ3QppLwKPsM',
  authDomain: 'onevdr-50b2f.firebaseapp.com',
  projectId: 'onevdr-50b2f',
  storageBucket: 'onevdr-50b2f.appspot.com',
  messagingSenderId: '334037374325',
  appId: '1:334037374325:web:09a3be0847bee2e4c42f3c',
  measurementId: 'G-LTCFQP6Z6M',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
