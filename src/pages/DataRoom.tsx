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
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from '../components/FileUpload';

interface FileInfo {
  name: string;
  url: string;
  analysis: string;
  uploadDate: string;
  size: string;
}

const DataRoom: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleFileUploaded = (fileInfo: FileInfo) => {
    setFiles([...files, fileInfo]);
    setError(null);
    setIsUploadModalOpen(false);
  };

  const handleDeleteFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
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
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setIsUploadModalOpen(true)}
        sx={{ mb: 3 }}
      >
        Upload Document
      </Button>
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
                  <Chip label="Analyzed" color="success" size="small" />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => window.open(file.url)}
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
      {isUploadModalOpen && (
        <FileUpload
          onFileUploaded={handleFileUploaded}
          setIsLoading={setIsLoading}
          setError={setError}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </Box>
  );
};

export default DataRoom;
