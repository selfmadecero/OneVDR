import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { FileInfo } from '../types';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

interface FileShareProps {
  file: FileInfo;
  open: boolean;
  onClose: () => void;
}

const FileShare: React.FC<FileShareProps> = ({ file, open, onClose }) => {
  const [email, setEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [downloadable, setDownloadable] = useState(false);
  const [requireNDA, setRequireNDA] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    setShareResult(null);

    try {
      const shareFile = httpsCallable(functions, 'shareFile');
      const result = await shareFile({
        fileId: file.id,
        recipientEmail: email,
        expirationDays,
        downloadable,
        requireNDA,
      });

      const data = result.data as {
        success: boolean;
        message: string;
        shareLink: string;
      };
      if (data.success) {
        setShareLink(data.shareLink);
        await navigator.clipboard.writeText(data.shareLink);
        setShareResult('File shared successfully. Link copied to clipboard.');
      } else {
        setShareResult('Failed to share file. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      setShareResult(
        'An error occurred while sharing the file. Please try again.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setSnackbarOpen(true);
    }
  };

  const handleOpenLink = () => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Share File: {file.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Recipient Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Expiration (days)"
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={downloadable}
                  onChange={(e) => setDownloadable(e.target.checked)}
                />
              }
              label="Allow Download"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={requireNDA}
                  onChange={(e) => setRequireNDA(e.target.checked)}
                />
              }
              label="Require NDA"
            />
            {shareResult && (
              <Typography
                color={
                  shareResult.includes('successfully') ? 'success' : 'error'
                }
              >
                {shareResult}
              </Typography>
            )}
            {shareLink && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body1">Share Link:</Typography>
                <TextField
                  fullWidth
                  value={shareLink}
                  InputProps={{
                    readOnly: true,
                  }}
                  margin="normal"
                />
                <Button
                  variant="outlined"
                  onClick={handleCopyLink}
                  sx={{ mr: 1 }}
                >
                  Copy Link
                </Button>
                <Button variant="contained" onClick={handleOpenLink}>
                  Open Link
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleShare}
            variant="contained"
            color="primary"
            disabled={isSharing}
          >
            {isSharing ? <CircularProgress size={24} /> : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Link copied to clipboard"
      />
    </>
  );
};

export default FileShare;
