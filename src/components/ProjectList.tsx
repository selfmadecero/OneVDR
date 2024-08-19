import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const ProjectPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

interface Project {
  id: string;
  name: string;
  category: string;
}

interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onProjectSelect,
}) => {
  return (
    <List>
      {projects.map((project) => (
        <ListItem
          key={project.id}
          button
          onClick={() => onProjectSelect(project)}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {project.name}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip
                  label={project.category}
                  size="small"
                  sx={{ alignSelf: 'flex-start', mt: 1 }}
                />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ProjectList;
