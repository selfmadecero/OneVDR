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
import { auth } from '../services/firebase';
import { User } from '../types';
import {
  getCommunicationHistory,
  addCommunication,
  Communication,
} from '../services/mail';
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

const Email: React.FC = () => {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      setIsLoading(true);
      try {
        const fetchedEmails = await getEmails();
        setEmails(fetchedEmails);
      } catch (err) {
        setError('Failed to fetch emails');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const handleSyncEmails = async () => {
    try {
      setIsLoading(true);
      const syncedEmails = await syncGoogleMail();
      setEmails(syncedEmails);
      setError(null);
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError('Failed to sync emails from Gmail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Email Inbox
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSyncEmails}
          sx={{ mr: 2 }}
        >
          Sync Gmail
        </Button>
        <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
          Note: For the MVP version, only Google Mail integration is available.
        </Typography>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
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
        )}
      </StyledPaper>
      <InvestorCommunication />
    </Box>
  );
};

export default Email;
