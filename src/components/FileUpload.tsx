import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { analyzePDF } from '../services/openai';

interface FileInfo {
  name: string;
  url: string;
  analysis: string;
  uploadDate: string;
  size: string;
}

interface FileUploadProps {
  onFileUploaded: (fileInfo: FileInfo) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  setIsLoading,
  setError,
  onClose,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setIsLoading(true);

    try {
      const storageRef = ref(storage, `pdfs/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const analysis = await analyzePDF(url);

      const fileInfo: FileInfo = {
        name: file.name,
        url,
        analysis,
        uploadDate: new Date().toISOString(),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      };

      onFileUploaded(fileInfo);
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file');
    } finally {
      setUploading(false);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        accept="application/pdf"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" disabled={uploading}>
          {uploading ? <CircularProgress size={24} /> : 'Upload PDF'}
        </Button>
      </label>
    </div>
  );
};

export default FileUpload;
