import React, { useState } from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { FileInfo } from '../types';
import FileAnalysisDialog from './FileAnalysisDialog';

interface FileListProps {
  files: FileInfo[];
}

const FileList: React.FC<FileListProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFileClick = (file: FileInfo) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <List>
        {files.map((file) => (
          <ListItem key={file.id} button onClick={() => handleFileClick(file)}>
            <ListItemText
              primary={file.name}
              secondary={`Size: ${file.size} | Status: ${file.status}`}
            />
          </ListItem>
        ))}
      </List>
      <FileAnalysisDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        file={selectedFile}
      />
    </>
  );
};

export default FileList;
