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

export const syncGoogleMail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) throw new Error('Failed to get Google credential');

    const token = credential.accessToken;
    if (!token) throw new Error('Failed to get access token');

    // Here you would typically send the token to your backend
    // The backend would use this token to fetch emails from Gmail API
    console.log('Successfully obtained Gmail access token');

    // For demonstration, let's fetch some dummy emails
    const dummyEmails: EmailMessage[] = [
      {
        id: '1',
        from: 'investor1@example.com',
        to: 'you@example.com',
        subject: 'Investment Opportunity',
        body: 'This is a dummy email body for investment opportunity.',
        date: new Date().toISOString(),
      },
      {
        id: '2',
        from: 'investor2@example.com',
        to: 'you@example.com',
        subject: 'Follow-up Meeting',
        body: 'This is a dummy email body for follow-up meeting.',
        date: new Date().toISOString(),
      },
    ];

    // Save dummy emails to Firestore
    for (const email of dummyEmails) {
      await saveEmail(email);
    }

    return dummyEmails;
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
