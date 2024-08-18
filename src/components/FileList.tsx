import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { FileInfo } from '../types';
import FileAnalysisDialog from './FileAnalysisDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from '@mui/material/Select';

interface FileListProps {
  files: FileInfo[];
  onDeleteFile: (fileId: string) => void;
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

type SortOption = 'name' | 'date' | 'size';

const FileList: React.FC<FileListProps> = ({ files, onDeleteFile }) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date');

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

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortOption(event.target.value as SortOption);
  };

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortOption) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      case 'size':
        return parseInt(b.size) - parseInt(a.size);
      default:
        return 0;
    }
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControl variant="outlined" size="small">
          <InputLabel id="sort-select-label">Sort by</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortOption}
            onChange={handleSortChange}
            label="Sort by"
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="size">Size</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <List>
        {sortedFiles.map((file) => (
          <StyledListItem key={file.id} onClick={() => handleFileClick(file)}>
            <ListItemText
              primary={
                <Typography
                  component="div"
                  variant="subtitle1"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => handleFileClick(file)}
                >
                  {file.name}
                </Typography>
              }
              secondary={
                <Box component="div">
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {`Size: ${file.size} | Status: ${
                      file.status
                    } | Date: ${new Date(
                      file.uploadDate
                    ).toLocaleDateString()}`}
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
              }
            />
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={(event) => handleDeleteClick(event, file.id)}
            >
              <DeleteIcon />
            </IconButton>
          </StyledListItem>
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
