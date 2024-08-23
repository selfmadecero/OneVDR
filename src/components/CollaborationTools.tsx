import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { sendMessage } from '../services/chat';

const CollaborationTools: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    sendMessage(message);
    setMessage('');
  };

  return (
    <Box>
      <Typography variant="h6">Collaboration Tools</Typography>
      <TextField
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <Button onClick={handleSendMessage}>Send</Button>
    </Box>
  );
};

export default CollaborationTools;
