export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface FileInfo {
  id: string;
  name: string;
  url: string;
  analysis: string | any;
  uploadDate: string;
  size: string;
  uploadProgress: number;
  status: 'uploading' | 'analyzing' | 'completed' | 'failed';
}
