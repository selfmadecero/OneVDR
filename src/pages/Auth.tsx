import React, { useState } from 'react';
import {
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import LockIcon from '@mui/icons-material/Lock';
import SpeedIcon from '@mui/icons-material/Speed';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
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
}));

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dataroom');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography
          variant="h3"
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
          Secure Access to Your Virtual Data Room
        </Typography>
        <GradientButton
          variant="contained"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <GoogleIcon />
            )
          }
          fullWidth
          sx={{ maxWidth: 400, mx: 'auto', mb: 6 }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </GradientButton>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <FeatureCard elevation={3}>
              <LockIcon sx={{ fontSize: 48, mb: 2, color: '#2196f3' }} />
              <Typography variant="h6" gutterBottom>
                Secure Authentication
              </Typography>
              <Typography>
                Your data is protected with industry-standard security measures.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <FeatureCard elevation={3}>
              <SpeedIcon sx={{ fontSize: 48, mb: 2, color: '#4caf50' }} />
              <Typography variant="h6" gutterBottom>
                Quick Access
              </Typography>
              <Typography>
                Sign in quickly and securely with your Google account.
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Auth;
