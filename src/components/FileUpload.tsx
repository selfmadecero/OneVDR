import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTask,
} from 'firebase/storage';
import { addFileInfo, storage } from '../services/firebase';
import { getAnalysis } from '../services/openai';
import { FileInfo, User } from '../types';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

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
  const [files, setFiles] = useState<File[]>([]);
  const [uploadTasks, setUploadTasks] = useState<{ [key: string]: UploadTask }>(
    {}
  );
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [analysisProgress, setAnalysisProgress] = useState<{
    [key: string]: number;
  }>({});
  const [fileStatus, setFileStatus] = useState<{
    [key: string]:
      | 'uploading'
      | 'analyzing'
      | 'completed'
      | 'failed'
      | 'paused';
  }>({});

  useEffect(() => {
    const simulateAnalysisProgress = (fileName: string) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
        }
        setAnalysisProgress((prev) => ({ ...prev, [fileName]: progress }));
      }, 1000);
      return interval;
    };

    Object.entries(fileStatus).forEach(([fileName, status]) => {
      if (status === 'analyzing') {
        const interval = simulateAnalysisProgress(fileName);
        return () => clearInterval(interval);
      }
    });
  }, [fileStatus]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
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

      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    },
    [user, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    useFsAccessApi: false,
  });

  useEffect(() => {
    const uploadFile = async (file: File) => {
      setFileStatus((prev) => ({ ...prev, [file.name]: 'uploading' }));
      const storageRef = ref(storage, `users/${user.uid}/pdfs/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadTasks((prev) => ({ ...prev, [file.name]: uploadTask }));

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          console.error('Error uploading file:', error);
          setError('File upload failed. Please try again.');
          setFileStatus((prev) => ({ ...prev, [file.name]: 'failed' }));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFileStatus((prev) => ({ ...prev, [file.name]: 'analyzing' }));

            const fileInfo: FileInfo = {
              id: file.name,
              name: file.name,
              url: downloadURL,
              analysis: '',
              uploadDate: new Date().toISOString(),
              size: formatFileSize(file.size),
              uploadProgress: 100,
              status: 'analyzing',
            };

            await addFileInfo(user.uid, fileInfo);
            onFileUploaded(fileInfo);

            const analysis = await getAnalysis(
              `users/${user.uid}/pdfs/${file.name}`,
              (progress) => {
                setAnalysisProgress((prev) => ({
                  ...prev,
                  [file.name]: progress,
                }));
              }
            );

            const updatedFileInfo: FileInfo = {
              ...fileInfo,
              analysis: analysis,
              status: 'completed',
            };

            await addFileInfo(user.uid, updatedFileInfo);
            onFileUploaded(updatedFileInfo);
            setFileStatus((prev) => ({ ...prev, [file.name]: 'completed' }));
          } catch (error) {
            console.error('Error analyzing file:', error);
            setError('File analysis failed. Please try again.');
            setFileStatus((prev) => ({ ...prev, [file.name]: 'failed' }));
          }
        }
      );
    };

    files.forEach((file) => {
      if (!uploadTasks[file.name]) {
        uploadFile(file);
      }
    });
  }, [files, user, onFileUploaded, setError, uploadTasks]);

  const handlePauseResume = (fileName: string) => {
    const task = uploadTasks[fileName];
    if (task) {
      if (fileStatus[fileName] === 'paused') {
        task.resume();
        setFileStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));
      } else {
        task.pause();
        setFileStatus((prev) => ({ ...prev, [fileName]: 'paused' }));
      }
    }
  };

  const handleCancel = (fileName: string) => {
    const task = uploadTasks[fileName];
    if (task) {
      task.cancel();
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName)
      );
      setUploadTasks((prev) => {
        const newTasks = { ...prev };
        delete newTasks[fileName];
        return newTasks;
      });
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
      setAnalysisProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
      setFileStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[fileName];
        return newStatus;
      });
    }
  };

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
        {isDragActive ? (
          <Typography>Drop the files here</Typography>
        ) : (
          <>
            <Typography>
              Drag and drop PDF files here or click to select
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Select Files
            </Button>
          </>
        )}
      </Box>
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upload Progress
          </Typography>
          {files.map((file) => (
            <Box
              key={file.name}
              sx={{ mb: 2, backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {file.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      fileStatus[file.name] === 'analyzing'
                        ? analysisProgress[file.name] || 0
                        : uploadProgress[file.name] || 0
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${Math.round(
                      fileStatus[file.name] === 'analyzing'
                        ? analysisProgress[file.name] || 0
                        : uploadProgress[file.name] || 0
                    )}%`}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handlePauseResume(file.name)}
                  disabled={
                    fileStatus[file.name] === 'completed' ||
                    fileStatus[file.name] === 'analyzing'
                  }
                >
                  {fileStatus[file.name] === 'paused' ? (
                    <PlayArrowIcon fontSize="small" />
                  ) : (
                    <PauseIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleCancel(file.name)}
                  disabled={fileStatus[file.name] === 'completed'}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {fileStatus[file.name] === 'analyzing'
                  ? 'Analyzing...'
                  : fileStatus[file.name]}
              </Typography>
              <Stepper
                activeStep={
                  fileStatus[file.name] === 'uploading'
                    ? 0
                    : fileStatus[file.name] === 'analyzing'
                    ? 1
                    : fileStatus[file.name] === 'completed'
                    ? 2
                    : 0
                }
                sx={{ mt: 1 }}
                alternativeLabel
              >
                <Step>
                  <StepLabel>Upload</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Analyze</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Complete</StepLabel>
                </Step>
              </Stepper>
            </Box>
          ))}
        </Box>
      )}
      <Alert severity="info" sx={{ mt: 2 }}>
        As an MVP, we currently support PDF uploads only. You can upload up to
        10 PDF files simultaneously, with each file not exceeding 10MB in size.
      </Alert>
    </Box>
  );
};

export default FileUpload;
