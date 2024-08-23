import { Investor } from '../types';

export interface AIInsights {
  summary: string;
  keyPoints: string[];
  investmentReadiness: number;
  riskFactors: string[];
  potentialInvestors: string[];
  marketAnalysis: string;
  competitiveAdvantage: string[];
  financialProjections: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  nextSteps: string[];
}

export const analyzeDocuments = async (
  investors: Investor[]
): Promise<AIInsights> => {
  // 실제 구현에서는 여기에 AI 분석 로직이 들어갑니다.
  // 지금은 더미 데이터를 반환합니다.
  return {
    summary:
      'This startup shows promising growth in the AI sector, with a strong technical team and innovative product.',
    keyPoints: [
      'Strong technical team',
      'Innovative AI product',
      'Growing market demand',
    ],
    investmentReadiness: 75,
    riskFactors: ['Competition from tech giants', 'Regulatory challenges'],
    potentialInvestors: [
      'Tech Ventures Capital',
      'AI Innovation Fund',
      'Global Growth Partners',
    ],
    marketAnalysis:
      'The AI market is expected to grow at a CAGR of 40% over the next 5 years, presenting significant opportunities for innovative startups.',
    competitiveAdvantage: [
      'Proprietary AI algorithm',
      'Strong partnerships with industry leaders',
      'First-mover advantage in niche market',
    ],
    financialProjections: {
      revenue: 5000000,
      expenses: 3000000,
      profit: 2000000,
    },
    nextSteps: [
      'Refine pitch deck',
      'Prepare for due diligence',
      'Schedule meetings with potential investors',
    ],
  };
};

export const analyzePotentialInvestorFit = async (
  investor: Investor
): Promise<number> => {
  // 실제 구현에서는 여기에 투자자와 스타트업의 적합도를 분석하는 AI 로직이 들어갑니다.
  // 지금은 랜덤한 값을 반환합니다.
  return Math.floor(Math.random() * 100);
};

export const generateInvestorInsights = async (
  investor: Investor
): Promise<string> => {
  // 실제 구현에서는 여기에 특정 투자자에 대한 인사이트를 생성하는 AI 로직이 들어갑니다.
  // 지금은 더미 데이터를 반환합니다.
  return `${investor.name} from ${investor.company} has shown interest in AI startups in the past. They typically invest in Series A rounds with ticket sizes ranging from $1M to $5M.`;
};

export const analyzeInvestorPortfolio = async (
  investor: Investor
): Promise<string[]> => {
  // 실제 구현에서는 투자자의 포트폴리오를 분석하는 AI 로직이 들어갑니다.
  // 지금은 더미 데이터를 반환합니다.
  return [
    'AI and Machine Learning',
    'FinTech',
    'HealthTech',
    'Enterprise SaaS',
    'Cybersecurity',
  ];
};

export const predictInvestmentLikelihood = async (
  investor: Investor,
  startup: any
): Promise<number> => {
  // 실제 구현에서는 투자자와 스타트업의 정보를 바탕으로 투자 가능성을 예측하는 AI 로직이 들어갑니다.
  // 지금은 랜덤한 값을 반환합니다.
  return Math.floor(Math.random() * 100);
};

export const suggestNextActions = async (
  investor: Investor,
  currentStep: number
): Promise<string[]> => {
  // 실제 구현에서는 현재 단계와 투자자 정보를 바탕으로 다음 행동을 제안하는 AI 로직이 들어갑니다.
  // 지금은 더미 데이터를 반환합니다.
  const actions = [
    'Send follow-up email',
    'Schedule a meeting',
    'Prepare pitch deck',
    'Conduct market research',
    'Prepare financial projections',
    'Draft term sheet',
    'Conduct due diligence',
  ];
  return actions.slice(currentStep, currentStep + 3);
};
