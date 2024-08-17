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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from 'firebase/storage';
import { getAnalysis } from '../services/openai';
import { addFileInfo } from '../services/firebase';
import { FileInfo, User } from '../types';

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
        setError(
          'No valid files were uploaded. Please check file size limits.'
        );
        return;
      }

      if (uploadedCount + validFiles.length > MAX_FILES) {
        setError(`You can only upload up to ${MAX_FILES} files in total.`);
        return;
      }

      setIsLoading(true);
      setError(null);

      for (const file of validFiles) {
        try {
          const storageRef = ref(
            storage,
            `users/${user.uid}/pdfs/${file.name}`
          );
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 90; // 최대 90%까지만 진행
              const fileInfo: FileInfo = {
                id: file.name,
                name: file.name,
                url: '',
                analysis: '',
                uploadDate: new Date().toISOString(),
                size: formatFileSize(file.size),
                uploadProgress: progress,
              };
              onFileUploaded(fileInfo);
            },
            (error) => {
              console.error('Error uploading file:', error);
              setError('Failed to upload file. Please try again.');
              setIsLoading(false);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const fileInfo: FileInfo = {
                id: file.name,
                name: file.name,
                url: downloadURL,
                analysis: '',
                uploadDate: new Date().toISOString(),
                size: formatFileSize(file.size),
                uploadProgress: 90, // 업로드 완료 시 90%로 설정
              };
              onFileUploaded(fileInfo);

              // 분석 시작
              const updateProgress = (progress: number) => {
                const totalProgress = 90 + (progress * 10) / 100; // 90%에서 100%까지
                onFileUploaded({ ...fileInfo, uploadProgress: totalProgress });
              };

              try {
                const analysis = await getAnalysis(
                  `users/${user.uid}/pdfs/${file.name}`,
                  updateProgress
                );
                const updatedFileInfo = {
                  ...fileInfo,
                  analysis,
                  uploadProgress: 100,
                };
                await addFileInfo(user.uid, updatedFileInfo);
                onFileUploaded(updatedFileInfo);
              } catch (error) {
                console.error('Error analyzing file:', error);
                let errorMessage = 'An unknown error occurred';
                if (error instanceof Error) {
                  errorMessage = error.message;
                }
                setError(errorMessage);
                const failedFileInfo = {
                  ...fileInfo,
                  analysis: 'Analysis failed',
                  uploadProgress: 100,
                };
                await addFileInfo(user.uid, failedFileInfo);
                onFileUploaded(failedFileInfo);
              } finally {
                setIsLoading(false);
              }
            }
          );

          await addFileInfo(user.uid, {
            id: file.name,
            name: file.name,
            url: '',
            analysis: '',
            uploadDate: new Date().toISOString(),
            size: formatFileSize(file.size),
            uploadProgress: 0,
          });
        } catch (error) {
          console.error('Error uploading file:', error);
          setError('Failed to upload file. Please try again.');
        }
      }

      setIsLoading(false);
    },
    [user, onFileUploaded, setIsLoading, setError]
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
              aria-label="파일 선택"
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
