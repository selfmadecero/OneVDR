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
import { getAnalysis } from '../services/openai';
import { addFileInfo } from '../services/firebase';
import { User } from '../types';

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
  user: User;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  setIsLoading,
  setError,
  user,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isPickerActive, setIsPickerActive] = useState(false);

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
        setError(`You can only upload up to ${MAX_FILES} files in total.`);
        return;
      }

      setUploading(true);
      setIsLoading(true);

      try {
        for (const file of validFiles) {
          const storageRef = ref(
            storage,
            `users/${user.uid}/pdfs/${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);

          const fileInfo: FileInfo = {
            name: file.name,
            url,
            analysis: 'Analysis in progress...',
            uploadDate: new Date().toLocaleString(),
            size: formatFileSize(file.size),
          };

          await addFileInfo(user.uid, fileInfo);
          onFileUploaded(fileInfo);
          setUploadedCount((prev) => prev + 1);

          // Wait for 30 seconds before fetching the analysis
          setTimeout(async () => {
            const analysis = await getAnalysis(
              `users/${user.uid}/pdfs/${file.name}`
            );
            const updatedFileInfo = { ...fileInfo, analysis };
            await addFileInfo(user.uid, updatedFileInfo);
            onFileUploaded(updatedFileInfo);
          }, 30000);
        }
      } catch (error) {
        console.error('Error adding file info to Firestore:', error);
        setError('Error uploading file info. Please try again.');
        // 추가: 업로드 실패 시 uploadedCount를 감소시킵니다.
        setUploadedCount((prev) => Math.max(0, prev - 1));
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
    useFsAccessApi: false,
  });

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isPickerActive) {
      setIsPickerActive(true);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.multiple = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          onDrop(Array.from(files));
        }
        setIsPickerActive(false);
      };
      input.click();
    }
  };

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
          <Typography>Drop the files here</Typography>
        ) : (
          <>
            <Typography>
              Drag and drop PDF files here or click to select
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleButtonClick}
              sx={{ mt: 2 }}
            >
              Select Files
            </Button>
          </>
        )}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        As an MVP, we currently support PDF uploads only. You can upload up to
        10 PDF files simultaneously, with each file not exceeding 10MB in size.
      </Alert>
    </Box>
  );
};

export default FileUpload;
