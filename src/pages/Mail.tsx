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
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';
import { User } from '../types';

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

interface Email {
  id: string;
  subject: string;
  sender: string;
  date: string;
  content: string;
}

const Mail: React.FC = () => {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    // Fetch emails from the server
    // This is a placeholder. You should implement the actual fetching logic.
    setIsLoading(true);
    setTimeout(() => {
      setEmails([
        {
          id: '1',
          subject: 'Welcome',
          sender: 'admin@onevdr.com',
          date: '2023-05-01',
          content: 'Welcome to OneVDR!',
        },
        {
          id: '2',
          subject: 'Investor Meeting',
          sender: 'investor@example.com',
          date: '2023-05-02',
          content: "Let's schedule a meeting.",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSendEmail = () => {
    // Send email logic here
    console.log('Sending email:', newEmail);
    setNewEmail({ to: '', subject: '', content: '' });
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Mail
        </Typography>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List>
            {emails.map((email) => (
              <React.Fragment key={email.id}>
                <ListItem>
                  <ListItemText
                    primary={email.subject}
                    secondary={`From: ${email.sender} | Date: ${email.date}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </StyledPaper>

      <StyledPaper>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Compose Email
        </Typography>
        <TextField
          fullWidth
          label="To"
          value={newEmail.to}
          onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Subject"
          value={newEmail.subject}
          onChange={(e) =>
            setNewEmail({ ...newEmail, subject: e.target.value })
          }
          margin="normal"
        />
        <TextField
          fullWidth
          label="Content"
          value={newEmail.content}
          onChange={(e) =>
            setNewEmail({ ...newEmail, content: e.target.value })
          }
          margin="normal"
          multiline
          rows={4}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendEmail}
          sx={{ mt: 2 }}
        >
          Send Email
        </Button>
      </StyledPaper>
    </Box>
  );
};

export default Mail;
