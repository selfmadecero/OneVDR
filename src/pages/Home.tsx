import React from 'react';
import { Typography, Button, Container, Box, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: 3,
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
  },
}));

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Welcome to OneVDR
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Secure, Analyze, and Collaborate on Your Documents
        </Typography>
        <GradientButton
          variant="contained"
          size="large"
          onClick={() => navigate('/auth')}
          startIcon={<CloudUploadIcon />}
        >
          Get Started
        </GradientButton>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <FeatureCard elevation={3}>
            <SecurityIcon sx={{ fontSize: 48, mb: 2, color: '#2196f3' }} />
            <Typography variant="h6" gutterBottom>
              Secure Storage
            </Typography>
            <Typography>
              Store your sensitive documents in our highly secure virtual data
              room.
            </Typography>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <FeatureCard elevation={3}>
            <AnalyticsIcon sx={{ fontSize: 48, mb: 2, color: '#4caf50' }} />
            <Typography variant="h6" gutterBottom>
              AI-Powered Analysis
            </Typography>
            <Typography>
              Get instant insights from your documents using our advanced AI
              technology.
            </Typography>
          </FeatureCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <FeatureCard elevation={3}>
            <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: '#ff9800' }} />
            <Typography variant="h6" gutterBottom>
              Easy Upload
            </Typography>
            <Typography>
              Quickly upload and organize your PDF documents with our
              user-friendly interface.
            </Typography>
          </FeatureCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
