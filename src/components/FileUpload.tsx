import React, { useState, useCallback } from 'react';
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { analyzePDF } from '../services/openai';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';

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
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  setIsLoading,
  setError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [user] = useAuthState(auth);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        setError('Please sign in to upload files.');
        return;
      }

      const validFiles = acceptedFiles.filter(
        (file) => file.size <= MAX_FILE_SIZE
      );

      if (validFiles.length === 0) {
        setError('No valid files selected. Each file must be 10MB or less.');
        return;
      }

      if (uploadedCount + validFiles.length > MAX_FILES) {
        setError(`You can only upload up to ${MAX_FILES} files at a time.`);
        return;
      }

      setUploading(true);
      setIsLoading(true);

      try {
        for (const file of validFiles) {
          const storageRef = ref(storage, `pdfs/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);

          // Wait for a short time to allow the Firebase Function to process the file
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const analysis = await analyzePDF(`pdfs/${file.name}`);

          const fileInfo: FileInfo = {
            name: file.name,
            url,
            analysis,
            uploadDate: new Date().toISOString(),
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          };

          onFileUploaded(fileInfo);
          setUploadedCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(
          error instanceof Error ? error.message : 'Error uploading file'
        );
      } finally {
        setUploading(false);
        setIsLoading(false);
      }
    },
    [onFileUploaded, setIsLoading, setError, uploadedCount, user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
  });

  if (!user) {
    return <Typography>Please sign in to upload files.</Typography>;
  }

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #cccccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f0f0f0',
          },
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <CircularProgress />
        ) : isDragActive ? (
          <Typography>Drop the PDF files here...</Typography>
        ) : (
          <Typography>
            Drag and drop up to 5 PDF files here, or click to select files
          </Typography>
        )}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        You can upload up to {MAX_FILES} files, each 10MB or less.
      </Alert>
    </Box>
  );
};

export default FileUpload;
