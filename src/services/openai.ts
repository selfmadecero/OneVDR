import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from './firebase';

export const getAnalysis = async (filePath: string): Promise<any> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const db = getFirestore();
    const analysisPath = filePath.split('/').pop(); // Get only the file name
    if (!analysisPath) throw new Error('Invalid file path');
    const docRef = doc(db, 'users', user.uid, 'analyses', analysisPath);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().analysis;
    } else {
      return 'Analysis not available yet. Please try again later.';
    }
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return 'Error fetching analysis. Please try again later.';
  }
};
