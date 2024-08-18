import { getIdToken } from 'firebase/auth';
import { auth } from './firebase';

interface Keyword {
  word: string;
  explanation: string;
}

interface AnalysisResult {
  summary: string;
  keywords: Keyword[];
  categories: string[];
  tags: string[];
  keyInsights: string[];
  toneAndStyle: string;
  targetAudience: string;
  potentialApplications: string[];
}

export const getAnalysis = async (
  filePath: string,
  updateProgress?: (progress: number) => void
): Promise<AnalysisResult> => {
  try {
    const idToken = await getIdToken(auth.currentUser!);
    const response = await fetch(
      'https://us-central1-onevdr-50b2f.cloudfunctions.net/analyzeDocument',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ filePath, userId: auth.currentUser!.uid }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    let result = '';
    let progress = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
      progress += value.length;
      if (updateProgress) {
        updateProgress(Math.min((progress / 1000) * 10, 100)); // 예시로 1000바이트마다 10% 증가
      }
    }

    return JSON.parse(result) as AnalysisResult;
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    if (error.message.includes('HTTP error! status: 401')) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.message.includes('HTTP error! status: 500')) {
      throw new Error(
        'Internal server error occurred. Please try again later.'
      );
    } else {
      throw new Error(
        `Error analyzing document: ${error.message || 'Unknown error'}`
      );
    }
  }
};
