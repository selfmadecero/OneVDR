import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { uploadFile, getDocuments } from '../services/blockchain';

interface Document {
  name: string;
  uploadDate: string;
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const docs = await getDocuments();
      setDocuments(docs);
    };
    fetchDocuments();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
      const updatedDocs = await getDocuments();
      setDocuments(updatedDocs);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Document Manager</Typography>
      <Button variant="contained" component="label">
        Upload File
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>
      <List>
        {documents.map((doc, index) => (
          <ListItem key={index}>
            <ListItemText primary={doc.name} secondary={doc.uploadDate} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DocumentManager;
