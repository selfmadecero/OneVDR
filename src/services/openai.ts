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

    const result = await response.json();
    return result as AnalysisResult;
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    if (error.message.includes('HTTP error! status: 401')) {
      throw new Error('인증에 실패했습니다. 다시 로그인해 주세요.');
    } else if (error.message.includes('HTTP error! status: 500')) {
      throw new Error(
        '서버 내부 오류가 발생했습니다. 나중에 다시 시도해 주세요.'
      );
    } else {
      throw new Error(
        `문서 분석 중 오류 발생: ${error.message || '알 수 없는 오류'}`
      );
    }
  }
};
