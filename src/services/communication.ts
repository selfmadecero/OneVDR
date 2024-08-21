import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';

interface Communication {
  id: string;
  type: 'email' | 'phone' | 'meeting';
  date: string;
  content: string;
  investorName: string;
}

export const getCommunicationHistory = async (): Promise<Communication[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const communicationsRef = collection(db, 'users', user.uid, 'communications');
  const q = query(communicationsRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Communication)
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
