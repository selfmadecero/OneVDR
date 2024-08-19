import React from 'react';
import { Box, Typography, Chip, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

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

const ProjectList: React.FC = () => {
  // 임시 프로젝트 데이터
  const projects = [
    { id: 1, name: '프로젝트 A', category: '개발' },
    { id: 2, name: '프로젝트 B', category: '마케팅' },
    { id: 3, name: '프로젝트 C', category: '디자인' },
    { id: 4, name: '프로젝트 D', category: '연구' },
  ];

  return (
    <Grid container spacing={3}>
      {projects.map((project) => (
        <Grid item xs={12} sm={6} md={3} key={project.id}>
          <ProjectPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              {project.name}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={project.category}
              size="small"
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            />
          </ProjectPaper>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectList;
