export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface FileInfo {
  id: string;
  name: string;
  url: string;
  analysis: AnalysisResult | string;
  uploadDate: string;
  size: string;
  uploadProgress: number;
  status: 'uploading' | 'analyzing' | 'completed' | 'failed';
}

export interface Keyword {
  word: string;
  explanation: string;
}

export interface AnalysisResult {
  summary: string;
  keywords: Keyword[];
  categories: string[];
  tags: string[];
  keyInsights: string[];
  toneAndStyle: string;
  targetAudience: string;
  potentialApplications: string[];
}

export interface DataRoomStats {
  lastAccessed: string;
  documentsViewed: number;
  timeSpent: number;
}

export interface ActivityLog {
  timestamp: string;
  action: string;
  fileId: string;
}

export interface Investor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  currentStep: number;
  status: 'active' | 'paused' | 'closed';
  investmentAmount: number;
  lastContact: string;
  notes: string;
  comments: { id: string; text: string; date: string }[];
  industry: string;
  fundSize: number;
  investmentStage: string;
  location: string;
  importance: 'low' | 'medium' | 'high';
}
