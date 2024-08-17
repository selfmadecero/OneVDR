import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  styled,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from '../components/FileUpload';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FileInfo, User } from '../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTableContainer = styled(TableContainer)<{
  component?: React.ElementType;
}>(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 'none',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
}));

const ProgressWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 24,
  borderRadius: 12,
  overflow: 'hidden',
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: '100%',
  borderRadius: 12,
}));

const ProgressLabel = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: theme.palette.getContrastText(theme.palette.primary.main),
  fontWeight: 'bold',
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
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
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
      <StyledTableContainer component={Paper}>
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
                <StyledTableCell>{file.name}</StyledTableCell>
                <StyledTableCell>{file.uploadDate}</StyledTableCell>
                <StyledTableCell>{file.size}</StyledTableCell>
                <StyledTableCell>
                  {typeof file.analysis === 'string' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress
                        variant="determinate"
                        value={file.uploadProgress || 0}
                        size={24}
                        thickness={4}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {file.uploadProgress
                          ? `${Math.round(file.uploadProgress)}%`
                          : 'Analyzing...'}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip
                      label="Analyzed"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon />}
                      sx={{ borderRadius: '16px' }}
                    />
                  )}
                </StyledTableCell>
                <StyledTableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(file)}
                    disabled={typeof file.analysis === 'string'}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedFile?.name}</DialogTitle>
        <DialogContent>
          {selectedFile && typeof selectedFile.analysis === 'object' ? (
            <Box>
              <Typography variant="h6">Summary</Typography>
              <Typography>{selectedFile.analysis.summary}</Typography>
              <Typography variant="h6">Keywords</Typography>
              <ul>
                {selectedFile.analysis.keywords.map(
                  (keyword: any, index: number) => (
                    <li key={index}>
                      <strong>{keyword.word}</strong>: {keyword.explanation}
                    </li>
                  )
                )}
              </ul>
              <Typography variant="h6">Categories</Typography>
              <ul>
                {selectedFile.analysis.categories.map(
                  (category: string, index: number) => (
                    <li key={index}>{category}</li>
                  )
                )}
              </ul>
              <Typography variant="h6">Tags</Typography>
              <ul>
                {selectedFile.analysis.tags.map(
                  (tag: string, index: number) => (
                    <li key={index}>{tag}</li>
                  )
                )}
              </ul>
              <Typography variant="h6">Key Insights</Typography>
              <ul>
                {selectedFile.analysis.keyInsights.map(
                  (insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  )
                )}
              </ul>
              <Typography variant="h6">Tone and Style</Typography>
              <Typography>{selectedFile.analysis.toneAndStyle}</Typography>
              <Typography variant="h6">Target Audience</Typography>
              <Typography>{selectedFile.analysis.targetAudience}</Typography>
              <Typography variant="h6">Potential Applications</Typography>
              <ul>
                {selectedFile.analysis.potentialApplications.map(
                  (application: string, index: number) => (
                    <li key={index}>{application}</li>
                  )
                )}
              </ul>
            </Box>
          ) : (
            <Typography>{selectedFile?.analysis}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataRoom;
