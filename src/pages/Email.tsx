import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { syncGoogleMail, getEmails, EmailMessage } from '../services/mail';
import InvestorCommunication from '../components/InvestorCommunication';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: theme.spacing(3),
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
}));

const ArcCard = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3),
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  transition: 'all 0.3s ease-in-out',
  marginBottom: theme.spacing(2),
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
}));

const Email: React.FC = () => {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const fetchedEmails = await getEmails();
          setEmails(fetchedEmails);
        } catch (err) {
          setError('Failed to fetch emails');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchEmails();
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleSyncEmails = async () => {
    if (user) {
      setIsLoading(true);
      try {
        const syncedEmails = await syncGoogleMail();
        setEmails(syncedEmails);
        setError(null);
      } catch (err) {
        console.error('Error syncing emails:', err);
        setError('Failed to sync emails from Gmail. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
      >
        Email Inbox
      </Typography>

      <ArcCard>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: theme.palette.primary.main }}
        >
          Sync Gmail
        </Typography>
        {!user && (
          <GradientButton onClick={handleGoogleSignIn}>
            Sign in with Google
          </GradientButton>
        )}
        {user && (
          <GradientButton onClick={handleSyncEmails} disabled={isLoading}>
            {isLoading ? 'Syncing...' : 'Sync Gmail'}
          </GradientButton>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {isLoading && <CircularProgress />}
        <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
          Note: For the MVP version, only Google Mail integration is available.
        </Typography>
      </ArcCard>

      <ArcCard>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: theme.palette.primary.main }}
        >
          Email List
        </Typography>
        <List>
          {emails.map((email) => (
            <ListItem key={email.id}>
              <ListItemText
                primary={email.subject}
                secondary={`From: ${email.from} | Date: ${new Date(
                  email.date
                ).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </ArcCard>

      <ArcCard>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: theme.palette.primary.main }}
        >
          Investor Communication
        </Typography>
        <InvestorCommunication />
      </ArcCard>
    </Box>
  );
};

export default Email;
