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

export const syncGoogleMail = async (): Promise<EmailMessage[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const idToken = await user.getIdToken();
    const functions = getFunctions();
    const getGmailMessages = httpsCallable<{ idToken: string }, EmailMessage[]>(
      functions,
      'getGmailMessages'
    );
    console.log('Calling getGmailMessages function');
    const result = await getGmailMessages({ idToken });
    console.log('getGmailMessages result:', result);
    const emails = result.data;

    // Save emails to Firestore
    for (const email of emails) {
      await saveEmail(email);
    }

    return emails;
  } catch (error) {
    console.error('Detailed error syncing Google Mail:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to sync Gmail: ${error.message}`);
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {
      throw new Error(
        `Failed to sync Gmail: ${(error as { message: string }).message}`
      );
    } else {
      throw new Error('Failed to sync Gmail: Unknown error');
    }
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
