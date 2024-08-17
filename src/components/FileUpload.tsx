import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { storage, db, auth } from '../services/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

interface FileUploadProps {
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ setIsLoading, setError }) => {
  const [user] = useAuthState(auth);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (validFiles.length > MAX_FILES) {
        setError(`You can only upload up to ${MAX_FILES} files at a time.`);
        return;
      }

      setUploading(true);
      setIsLoading(true);
      setError(null);

      try {
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const storageRef = ref(
            storage,
            `users/${user.uid}/pdfs/${file.name}`
          );

          // Upload file to Firebase Storage
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);

          const fileInfo = {
            name: file.name,
            url,
            analysis: 'Analyzing...',
            uploadDate: new Date().toISOString(),
            size: file.size,
          };

          // Add document to Firestore
          const docRef = await addDoc(
            collection(db, 'users', user.uid, 'files'),
            fileInfo
          );

          setUploadProgress(((i + 1) / validFiles.length) * 100);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(
          error instanceof Error ? error.message : 'Error uploading file'
        );
      } finally {
        setUploading(false);
        setIsLoading(false);
        setUploadProgress(0);
      }
    },
    [user, setIsLoading, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxFiles: MAX_FILES,
    noClick: true, // 클릭 이벤트를 비활성화합니다.
  });

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDelete = useCallback(
    async (fileId: string, fileName: string) => {
      if (!user) {
        setError('Please sign in to delete files.');
        return;
      }

      try {
        setIsLoading(true);

        // Firebase Storage에서 파일 삭제
        const fileRef = ref(storage, `users/${user.uid}/pdfs/${fileName}`);
        await deleteObject(fileRef);

        // Firestore에서 문서 삭제
        await deleteDoc(doc(db, 'users', user.uid, 'files', fileId));

        // 상태 업데이트 (파일 목록에서 삭제된 파일 제거)
        // 이 부분은 상위 컴포넌트에서 처리해야 할 수 있습니다.
        // setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

        setIsLoading(false);
      } catch (error) {
        console.error('Error deleting file:', error);
        setError(
          error instanceof Error ? error.message : 'Error deleting file'
        );
        setIsLoading(false);
      }
    },
    [user, setIsLoading, setError]
  );

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #cccccc',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f0f0f0',
          },
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the files here...' : 'Drag and drop files here'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleClick}
          sx={{ mt: 2 }}
        >
          Select Files
        </Button>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          (Only PDF files are accepted, max 5 files, 10MB each)
        </Typography>
      </Box>
      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
