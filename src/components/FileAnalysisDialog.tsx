import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  styled,
  Typography,
} from "@mui/material";
import React from "react";
import { FileInfo } from "../types";

interface Keyword {
  word: string;
  explanation: string;
}

interface AnalysisResult {
  summary: string;
  keywords: Keyword[];
  categories: string[];
  tags: string[];
  keyInsights: string[];
  toneAndStyle: string;
  targetAudience: string;
  potentialApplications: string[];
}

interface FileAnalysisDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileInfo | null;
}

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FileAnalysisDialog: React.FC<FileAnalysisDialogProps> = ({
  open,
  onClose,
  file,
}) => {
  if (!file || typeof file.analysis === "string") {
    return null;
  }

  const analysis = file.analysis as AnalysisResult;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{file.name} - Analysis Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body1">{analysis.summary}</Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Keywords
          </Typography>
          {analysis.keywords.map((keyword, index) => (
            <StyledChip
              key={index}
              label={keyword.word}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Categories
          </Typography>
          {analysis.categories.map((category, index) => (
            <StyledChip
              key={index}
              label={category}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <List>
            {analysis.keyInsights.map((insight, index) => (
              <React.Fragment key={index}>
                <StyledListItem>
                  <ListItemText primary={insight} />
                </StyledListItem>
                {index < analysis.keyInsights.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tone and Style
          </Typography>
          <Typography variant="body1">{analysis.toneAndStyle}</Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Target Audience
          </Typography>
          <Typography variant="body1">{analysis.targetAudience}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Potential Applications
          </Typography>
          <List>
            {analysis.potentialApplications.map((application, index) => (
              <React.Fragment key={index}>
                <StyledListItem>
                  <ListItemText primary={application} />
                </StyledListItem>
                {index < analysis.potentialApplications.length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileAnalysisDialog;
