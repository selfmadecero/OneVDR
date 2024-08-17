export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface FileInfo {
  name: string;
  url: string;
  analysis: string;
  uploadDate: string;
  size: string;
}
