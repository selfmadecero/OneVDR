import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const analyzePDF = async (filePath: string): Promise<string> => {
  try {
    const db = getFirestore();
    const docRef = doc(db, 'analyses', filePath);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().analysis;
    } else {
      throw new Error('Analysis not found');
    }
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return 'Error analyzing PDF';
  }
};
