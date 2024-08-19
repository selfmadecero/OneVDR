import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { FileInfo } from '../types';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FolderViewProps {
  folders: Folder[];
  files: FileInfo[];
  onFolderSelect: (folder: Folder) => void;
  onFileSelect: (file: FileInfo) => void;
  onDeleteFile: (fileId: string) => void;
}

const FolderView: React.FC<FolderViewProps> = ({
  folders,
  files,
  onFolderSelect,
  onFileSelect,
  onDeleteFile,
}) => {
  return (
    <List>
      {folders.map((folder) => (
        <ListItem key={folder.id} button onClick={() => onFolderSelect(folder)}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
        </ListItem>
      ))}
      {files.map((file) => (
        <ListItem key={file.id} button onClick={() => onFileSelect(file)}>
          <ListItemIcon>
            <InsertDriveFileIcon />
          </ListItemIcon>
          <ListItemText
            primary={file.name}
            secondary={`Size: ${file.size} | Date: ${new Date(
              file.uploadDate
            ).toLocaleDateString()}`}
          />
          <IconButton onClick={() => onDeleteFile(file.id)}>
            <DeleteIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};

export default FolderView;
