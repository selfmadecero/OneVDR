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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from '../components/FileUpload';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FileInfo, User } from '../types';

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

const DataRoom: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      const filesRef = collection(db, 'files');
      const q = query(filesRef, where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newFiles: FileInfo[] = [];
        querySnapshot.forEach((doc) => {
          newFiles.push({
            name: doc.data().name,
            url: doc.data().url,
            analysis: doc.data().analysis,
            uploadDate: doc.data().uploadDate,
            size: doc.data().size,
          });
        });
        setFiles(newFiles);
      });
      return unsubscribe;
    }
  }, [user, db]);

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

  const handleDeleteFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
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
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          As this is an MVP version, you can upload up to 10 PDF files, each
          with a maximum size of 10MB.
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
            {files.map((file, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell>{file.name}</StyledTableCell>
                <StyledTableCell>{file.uploadDate}</StyledTableCell>
                <StyledTableCell>{file.size}</StyledTableCell>
                <StyledTableCell>
                  <Chip
                    label={
                      typeof file.analysis === 'string'
                        ? 'Analyzing'
                        : 'Analyzed'
                    }
                    color={
                      typeof file.analysis === 'string' ? 'warning' : 'success'
                    }
                    size="small"
                    sx={{ borderRadius: '4px' }}
                  />
                </StyledTableCell>
                <StyledTableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(file)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteFile(index)}
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
              {/* Add more sections for other analysis properties */}
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
