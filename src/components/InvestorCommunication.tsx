import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  getCommunicationHistory,
  addCommunication,
} from '../services/communication';

interface Communication {
  id: string;
  type: 'email' | 'phone' | 'meeting';
  date: string;
  content: string;
  investorName: string;
}

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const InvestorCommunication: React.FC = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [newCommunication, setNewCommunication] = useState<
    Omit<Communication, 'id' | 'date'>
  >({
    type: 'email',
    content: '',
    investorName: '',
  });

  useEffect(() => {
    const fetchCommunications = async () => {
      const history = await getCommunicationHistory();
      setCommunications(history);
    };
    fetchCommunications();
  }, []);

  const handleAddCommunication = async () => {
    if (newCommunication.content && newCommunication.investorName) {
      const addedCommunication = await addCommunication(newCommunication);
      setCommunications([...communications, addedCommunication]);
      setNewCommunication({ type: 'email', content: '', investorName: '' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Investor Communication Timeline
      </Typography>
      <List>
        {communications.map((comm, index) => (
          <React.Fragment key={comm.id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Typography>
                    {comm.investorName} -{' '}
                    {new Date(comm.date).toLocaleDateString()}
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <StyledChip label={comm.type} size="small" />
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {comm.content}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < communications.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Add New Communication
        </Typography>
        <TextField
          select
          label="Type"
          value={newCommunication.type}
          onChange={(e) =>
            setNewCommunication({
              ...newCommunication,
              type: e.target.value as 'email' | 'phone' | 'meeting',
            })
          }
          fullWidth
          margin="normal"
        >
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="phone">Phone</MenuItem>
          <MenuItem value="meeting">Meeting</MenuItem>
        </TextField>
        <TextField
          label="Investor Name"
          value={newCommunication.investorName}
          onChange={(e) =>
            setNewCommunication({
              ...newCommunication,
              investorName: e.target.value,
            })
          }
          fullWidth
          margin="normal"
        />
        <TextField
          label="Content"
          value={newCommunication.content}
          onChange={(e) =>
            setNewCommunication({
              ...newCommunication,
              content: e.target.value,
            })
          }
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddCommunication}
        >
          Add Communication
        </Button>
      </Box>
    </Box>
  );
};

export default InvestorCommunication;
