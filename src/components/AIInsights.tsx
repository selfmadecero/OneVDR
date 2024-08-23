import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { analyzeDocuments } from '../services/ai';

interface Insights {
  summary: string;
  keyPoints: string[];
  investmentReadiness: number;
  riskFactors: string[];
  potentialInvestors: string[];
}

const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const result = await analyzeDocuments([]); // 빈 배열 전달
        setInsights(result);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Insights
      </Typography>
      {insights && (
        <Card>
          <CardContent>
            <Typography variant="body1" paragraph>
              {insights.summary}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Key Points:
            </Typography>
            <Box mb={2}>
              {insights.keyPoints.map((point, index) => (
                <Chip key={index} label={point} sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Investment Readiness Score: {insights.investmentReadiness}%
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Risk Factors:
            </Typography>
            <Box mb={2}>
              {insights.riskFactors.map((factor, index) => (
                <Chip
                  key={index}
                  label={factor}
                  color="warning"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Potential Investors:
            </Typography>
            <Box>
              {insights.potentialInvestors.map((investor, index) => (
                <Chip
                  key={index}
                  label={investor}
                  color="success"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIInsights;
