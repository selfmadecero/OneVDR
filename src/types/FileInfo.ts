export interface FileInfo {
  id: string;
  name: string;
  url: string;
  analysis:
    | string
    | {
        summary: string;
        keywords: Array<{ word: string; explanation: string }>;
        categories: string[];
        tags: string[];
        keyInsights: string[];
        toneAndStyle: string;
        targetAudience: string;
        potentialApplications: string[];
      };
  uploadDate: string;
  size: string;
  uploadProgress?: number;
  analysisProgress?: number;
  deleted?: boolean;
}
