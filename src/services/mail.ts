import { auth, db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export interface Communication {
  id: string;
  type: 'email' | 'phone' | 'meeting';
  date: string;
  content: string;
  investorName: string;
}

const functions = getFunctions();

export const syncGoogleMail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

  try {
    const signInResult = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(signInResult);
    if (!credential) throw new Error('Failed to get Google credential');

    const token = credential.accessToken;
    if (!token) throw new Error('Failed to get access token');

    console.log('Successfully obtained Gmail access token');

    const getGmailMessages = httpsCallable(functions, 'getGmailMessages');
    const gmailResult = await getGmailMessages({ accessToken: token });
    const emails = gmailResult.data as EmailMessage[];

    // Save emails to Firestore
    for (const email of emails) {
      await saveEmail(email);
    }

    return emails;
  } catch (error) {
    console.error('Error syncing Google Mail:', error);
    throw error;
  }
};

export const saveEmail = async (email: Omit<EmailMessage, 'id'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const emailsRef = collection(db, 'users', user.uid, 'emails');
  const docRef = await addDoc(emailsRef, {
    ...email,
    date: new Date().toISOString(),
  });
  return { id: docRef.id, ...email };
};

export const getEmails = async (): Promise<EmailMessage[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const emailsRef = collection(db, 'users', user.uid, 'emails');
  const q = query(emailsRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as EmailMessage)
  );
};

export const getEmailsByInvestor = async (
  investorEmail: string
): Promise<EmailMessage[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const emailsRef = collection(db, 'users', user.uid, 'emails');
  const q = query(
    emailsRef,
    where('from', '==', investorEmail),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as EmailMessage)
  );
};

export const getCommunicationHistory = async (): Promise<Communication[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const communicationsRef = collection(db, 'users', user.uid, 'communications');
  const q = query(communicationsRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Communication)
  );
};

export const addCommunication = async (
  communication: Omit<Communication, 'id' | 'date'>
): Promise<Communication> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const communicationsRef = collection(db, 'users', user.uid, 'communications');
  const newCommunication = {
    ...communication,
    date: new Date().toISOString(),
  };

  const docRef = await addDoc(communicationsRef, newCommunication);
  return { id: docRef.id, ...newCommunication } as Communication;
};
