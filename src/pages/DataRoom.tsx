import React, { useState } from 'react';
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

interface FileInfo {
  name: string;
  url: string;
  analysis: string | any;
  uploadDate: string;
  size: string;
}

const DataRoom: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

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
        <FileUpload
          onFileUploaded={handleFileUploaded}
          setIsLoading={setIsLoading}
          setError={setError}
        />
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
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file, index) => (
              <TableRow key={index}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.uploadDate}</TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>
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
                  />
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
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
