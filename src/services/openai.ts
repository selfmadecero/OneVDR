import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const getAnalysis = async (
  filePath: string,
  updateProgress?: (progress: number) => void
): Promise<string> => {
  const analyzeDocument = httpsCallable(functions, 'analyzeDocument');

  try {
    const result = await analyzeDocument({ filePath });
    return result.data as string;
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('The service is currently busy. Please try again later.');
    } else if (error.code === 'functions/internal') {
      throw new Error('An internal error occurred. Please try again later.');
    } else if (error.details?.includes('OpenAI API error')) {
      throw new Error(
        'An error occurred with the analysis service. Please try again later.'
      );
    } else {
      throw new Error(
        `Error analyzing document: ${error.message || 'Unknown error'}`
      );
    }
  }
};
