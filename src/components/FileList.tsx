import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { FileInfo } from '../types';
import FileAnalysisDialog from './FileAnalysisDialog';
import FileShare from './FileShare';

interface FileListProps {
  files: FileInfo[];
  onDeleteFile: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDeleteFile }) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState<FileInfo | null>(null);

  const handleFileClick = (file: FileInfo) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleDeleteClick = (event: React.MouseEvent, fileId: string) => {
    event.stopPropagation();
    onDeleteFile(fileId);
  };

  const handleDownloadClick = (event: React.MouseEvent, fileUrl: string) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop() || 'download';
    link.click();
  };

  const handleShareClick = (event: React.MouseEvent, file: FileInfo) => {
    event.stopPropagation();
    setFileToShare(file);
    setShareDialogOpen(true);
  };

  return (
    <>
      <Grid container spacing={2}>
        {files.map((file) => (
          <Grid item xs={12} key={file.id}>
            <Card
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 },
              }}
              onClick={() => handleFileClick(file)}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {file.size} | Status: {file.status} | Date:{' '}
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {typeof file.analysis === 'object' &&
                      file.analysis.categories &&
                      file.analysis.categories.map((category) => (
                        <Chip
                          key={category}
                          label={category}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                  </Box>
                </Box>
                <IconButton
                  edge="end"
                  aria-label="share"
                  onClick={(event) => handleShareClick(event, file)}
                  sx={{ ml: 2 }}
                >
                  <ShareIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="download"
                  onClick={(event) => handleDownloadClick(event, file.url)}
                  sx={{ ml: 2 }}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(event) => handleDeleteClick(event, file.id)}
                  sx={{ ml: 2 }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <FileAnalysisDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        file={selectedFile}
      />
      {fileToShare && (
        <FileShare
          file={fileToShare}
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        />
      )}
    </>
  );
};

export default FileList;
