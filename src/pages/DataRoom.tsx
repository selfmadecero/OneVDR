import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Alert,
  styled,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  DeleteOutline,
  CloudUpload,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../services/firebase';
import { FileInfo, User } from '../types';
import FileUpload from '../components/FileUpload';
import FileAnalysisDialog from '../components/FileAnalysisDialog';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DataRoom: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      const filesRef = collection(db, 'users', user.uid, 'files');
      const q = query(filesRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newFiles: FileInfo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<FileInfo, 'id'>;
          newFiles.push({ ...data, id: doc.id } as FileInfo);
        });
        setFiles(newFiles);
      });
      return unsubscribe;
    }
  }, [user]);

  const handleFileUploaded = (fileInfo: FileInfo) => {
    setFiles((prevFiles) => {
      const index = prevFiles.findIndex((f) => f.name === fileInfo.name);
      if (index !== -1) {
        const newFiles = [...prevFiles];
        newFiles[index] = fileInfo;
        return newFiles;
      }
      return [...prevFiles, fileInfo];
    });
    setError(null);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'files', fileId));
      const storageRef = ref(storage, `users/${user.uid}/pdfs/${fileId}`);
      await deleteObject(storageRef);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleOpenDialog = (file: FileInfo) => {
    setSelectedFile(file);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFile(null);
  };

  return (
    <Box sx={{ width: '100%', p: 3, backgroundColor: '#f5f7fa' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
      >
        Data Room
      </Typography>
      <StyledPaper elevation={0} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
          Upload Documents
        </Typography>
        <FileUpload
          onFileUploaded={handleFileUploaded}
          setIsLoading={setIsLoading}
          setError={setError}
          user={user as User}
        />
      </StyledPaper>
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <StyledTableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>File Name</StyledTableCell>
              <StyledTableCell>Upload Date</StyledTableCell>
              <StyledTableCell>Size</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <StyledTableRow key={file.id}>
                <TableCell>
                  <Tooltip title="View Analysis">
                    <Typography
                      variant="body2"
                      component="a"
                      onClick={() => handleOpenDialog(file)}
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {file.name}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {new Date(file.uploadDate).toLocaleString()}
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>
                  {file.status === 'uploading' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CloudUpload color="action" />
                      <Box sx={{ width: '100%', ml: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={file.uploadProgress}
                        />
                      </Box>
                      <Box sx={{ minWidth: 35, ml: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >{`${Math.round(file.uploadProgress)}%`}</Typography>
                      </Box>
                    </Box>
                  ) : file.status === 'analyzing' ? (
                    <Chip
                      icon={<CircularProgress size="small" />}
                      label="Analyzing"
                      color="primary"
                      variant="outlined"
                    />
                  ) : file.status === 'completed' ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Analysis Complete"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<ErrorOutline />}
                      label="Analysis Failed"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDeleteFile(file.id)}
                    color="error"
                  >
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
      <FileAnalysisDialog
        open={openDialog}
        onClose={handleCloseDialog}
        file={selectedFile}
      />
    </Box>
  );
};

export default DataRoom;
