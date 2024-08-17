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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from '../components/FileUpload';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  DocumentData,
  QuerySnapshot,
  FirestoreError,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  deleteObject,
  getDownloadURL,
} from 'firebase/storage';

interface FileInfo extends DocumentData {
  id: string;
  name: string;
  url: string;
  analysis: string | any;
  uploadDate: string;
  size: string;
}

const DataRoom: React.FC = () => {
  const [user] = useAuthState(auth);
  const storage = getStorage();
  const [filesData, loading, firestoreError] = useCollectionData(
    user
      ? query(
          collection(db, 'users', user.uid, 'files'),
          orderBy('uploadDate', 'desc')
        )
      : null
  );

  const [files, setFiles] = useState<FileInfo[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (filesData && user) {
        const updatedFiles = await Promise.all(
          filesData.map(async (file) => {
            const fileRef = ref(storage, `users/${user.uid}/pdfs/${file.name}`);
            try {
              await getDownloadURL(fileRef);
              return {
                ...file,
                id: file.id || file.name,
              };
            } catch (error) {
              console.error(`Error fetching file ${file.name}:`, error);
              // 파일이 Storage에 존재하지 않으면 Firestore에서도 삭제
              if (file.id) {
                try {
                  await deleteDoc(doc(db, 'users', user.uid, 'files', file.id));
                  console.log(
                    `Deleted non-existent file ${file.name} from Firestore`
                  );
                } catch (deleteError) {
                  console.error(
                    `Error deleting file ${file.name} from Firestore:`,
                    deleteError
                  );
                }
              }
              return null;
            }
          })
        );
        setFiles(
          updatedFiles.filter((file): file is FileInfo => file !== null)
        );
      }
    };

    fetchFiles();
  }, [filesData, user, storage, db]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = (file: FileInfo) => {
    setSelectedFile(file);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDeleteFile = async (id: string, fileName: string) => {
    if (!user) {
      setError('User not authenticated. Please log in.');
      return;
    }
    try {
      setIsLoading(true);
      if (!id) {
        throw new Error('Invalid file ID');
      }

      // Delete document from Firestore first
      const fileDocRef = doc(db, 'users', user.uid, 'files', id);
      await deleteDoc(fileDocRef);

      // Verify if the document was actually deleted
      const docSnap = await getDoc(fileDocRef);
      if (docSnap.exists()) {
        throw new Error('Failed to delete document from Firestore');
      }

      // Then delete file from Firebase Storage
      const fileRef = ref(storage, `users/${user.uid}/pdfs/${fileName}`);
      await deleteObject(fileRef);

      // Update local state
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));

      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete file. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Data Room
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Documents
        </Typography>
        <FileUpload setIsLoading={setIsLoading} setError={setError} />
      </Paper>
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow key="header">
              <TableCell>File Name</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files && files.length > 0 ? (
              files.map((fileInfo) => {
                return (
                  <TableRow key={fileInfo.id}>
                    <TableCell>{fileInfo.name}</TableCell>
                    <TableCell>{fileInfo.uploadDate}</TableCell>
                    <TableCell>{fileInfo.size}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          typeof fileInfo.analysis === 'string'
                            ? 'Analyzing'
                            : 'Analyzed'
                        }
                        color={
                          typeof fileInfo.analysis === 'string'
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(fileInfo)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteFile(fileInfo.id, fileInfo.name)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  파일이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
