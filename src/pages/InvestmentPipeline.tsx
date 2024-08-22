import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import Confetti from 'react-confetti';

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

const steps = [
  'Initial Contact',
  'Pitch Deck',
  'Due Diligence',
  'Term Sheet',
  'Negotiation',
  'Closing',
];

interface Investor {
  id: string;
  name: string;
  company: string;
  email: string;
  currentStep: number;
  status: 'active' | 'paused' | 'closed';
  investmentAmount?: number;
  lastContact?: string;
  notes?: string;
}

const InvestmentPipeline: React.FC = () => {
  const [user] = useAuthState(auth);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [newInvestor, setNewInvestor] = useState<Omit<Investor, 'id'>>({
    name: '',
    company: '',
    email: '',
    currentStep: 0,
    status: 'active',
    investmentAmount: 0,
    lastContact: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'paused' | 'closed'
  >('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'investmentAmount'>(
    'name'
  );
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
  const [showConfetti, setShowConfetti] = useState(false);

  const toggleCardExpansion = (investorId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [investorId]: !prev[investorId],
    }));
  };

  useEffect(() => {
    if (user) {
      const investorsRef = collection(db, 'users', user.uid, 'investors');
      const q = query(investorsRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const investorList: Investor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          investorList.push({
            id: doc.id,
            ...data,
            currentStep:
              typeof data.currentStep === 'number' ? data.currentStep : 0,
          } as Investor);
        });
        setInvestors(investorList);
      });
      return unsubscribe;
    }
  }, [user]);

  const handleAddInvestor = async () => {
    if (user) {
      setIsLoading(true);
      try {
        const investorsRef = collection(db, 'users', user.uid, 'investors');
        await addDoc(investorsRef, newInvestor);
        setNewInvestor({
          name: '',
          company: '',
          email: '',
          currentStep: 0,
          status: 'active',
          investmentAmount: 0,
          lastContact: '',
          notes: '',
        });
      } catch (error) {
        console.error('Error adding investor:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateInvestorStep = async (
    investorId: string,
    newStep: number
  ) => {
    if (user) {
      const investorRef = doc(db, 'users', user.uid, 'investors', investorId);
      try {
        await updateDoc(investorRef, { currentStep: newStep });
        if (newStep === steps.length - 1) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch (error) {
        console.error('Error updating investor step:', error);
        setError('Failed to update investor step. Please try again.');
      }
    }
  };

  const handleUpdateInvestorStatus = async (
    investorId: string,
    newStatus: 'active' | 'paused' | 'closed'
  ) => {
    if (user) {
      const investorRef = doc(db, 'users', user.uid, 'investors', investorId);
      try {
        await updateDoc(investorRef, { status: newStatus });
        // 로컬 상태 업데이트는 제거합니다.
      } catch (error) {
        console.error('Error updating investor status:', error);
        setError('Failed to update investor status. Please try again.');
      }
    }
  };

  const handleDeleteInvestor = async (investorId: string) => {
    if (user) {
      try {
        const investorRef = doc(db, 'users', user.uid, 'investors', investorId);
        await deleteDoc(investorRef);
        setInvestors((prevInvestors) =>
          prevInvestors.filter((investor) => investor.id !== investorId)
        );
      } catch (error) {
        console.error('Error deleting investor:', error);
        setError('Failed to delete investor. Please try again.');
      }
    }
  };

  const handleEditInvestor = async (updatedInvestor: Investor) => {
    if (user) {
      const investorRef = doc(
        db,
        'users',
        user.uid,
        'investors',
        updatedInvestor.id
      );
      try {
        const { id, ...updateData } = updatedInvestor;
        await updateDoc(investorRef, updateData);
        setInvestors((prevInvestors) =>
          prevInvestors.map((investor) =>
            investor.id === updatedInvestor.id ? updatedInvestor : investor
          )
        );
        setEditingInvestor(null);
      } catch (error) {
        console.error('Error updating investor:', error);
        setError('Failed to update investor. Please try again.');
      }
    }
  };

  const filteredInvestors = investors.filter((investor) =>
    filterStatus === 'all' ? true : investor.status === filterStatus
  );

  const sortedInvestors = filteredInvestors.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'company') return a.company.localeCompare(b.company);
    if (sortBy === 'investmentAmount')
      return (b.investmentAmount || 0) - (a.investmentAmount || 0);
    return 0;
  });

  const InvestorCard: React.FC<{
    investor: Investor;
    expanded: boolean;
    onToggleExpand: () => void;
  }> = ({ investor, expanded, onToggleExpand }) => {
    return (
      <StyledPaper>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">{investor.name}</Typography>
            <Typography variant="body2">{investor.company}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2">
              Investment Amount: $
              {investor.investmentAmount?.toLocaleString() || 'N/A'}
            </Typography>
            <Chip
              label={investor.status}
              color={
                investor.status === 'active'
                  ? 'success'
                  : investor.status === 'paused'
                  ? 'warning'
                  : 'error'
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button onClick={onToggleExpand}>
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button onClick={() => setEditingInvestor(investor)}>Edit</Button>
            <Button
              color="error"
              onClick={() => setDeleteConfirmation(investor.id)}
            >
              Delete
            </Button>
          </Grid>
          {expanded && (
            <Grid item xs={12}>
              <Typography variant="body2">Email: {investor.email}</Typography>
              <Typography variant="body2">
                Last Contact: {investor.lastContact || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Notes: {investor.notes || 'N/A'}
              </Typography>
              <Stepper activeStep={investor.currentStep || 0} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Button
                variant="outlined"
                onClick={() => {
                  if (investor.currentStep < steps.length - 1) {
                    handleUpdateInvestorStep(
                      investor.id,
                      investor.currentStep + 1
                    );
                  }
                }}
                disabled={investor.currentStep === steps.length - 1}
              >
                Next Step
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  handleUpdateInvestorStatus(
                    investor.id,
                    investor.status === 'active' ? 'paused' : 'active'
                  )
                }
              >
                {investor.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
            </Grid>
          )}
        </Grid>
      </StyledPaper>
    );
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Investment Pipeline
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Add New Investor
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Investor Name"
              value={newInvestor.name}
              onChange={(e) =>
                setNewInvestor({ ...newInvestor, name: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Company"
              value={newInvestor.company}
              onChange={(e) =>
                setNewInvestor({ ...newInvestor, company: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Email"
              value={newInvestor.email}
              onChange={(e) =>
                setNewInvestor({ ...newInvestor, email: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Investment Amount"
              type="number"
              value={newInvestor.investmentAmount}
              onChange={(e) =>
                setNewInvestor({
                  ...newInvestor,
                  investmentAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Last Contact"
              type="date"
              value={newInvestor.lastContact}
              onChange={(e) =>
                setNewInvestor({ ...newInvestor, lastContact: e.target.value })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newInvestor.notes}
              onChange={(e) =>
                setNewInvestor({ ...newInvestor, notes: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleAddInvestor}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Add Investor'}
            </Button>
          </Grid>
        </Grid>
      </StyledPaper>

      <StyledPaper>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as typeof filterStatus)
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="investmentAmount">Investment Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </StyledPaper>

      {sortedInvestors.map((investor) => (
        <InvestorCard
          key={investor.id}
          investor={investor}
          expanded={expandedCards[investor.id] || false}
          onToggleExpand={() => toggleCardExpansion(investor.id)}
        />
      ))}

      {editingInvestor && (
        <Dialog
          open={!!editingInvestor}
          onClose={() => setEditingInvestor(null)}
        >
          <DialogTitle>Edit Investor</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Investor Name"
                  value={editingInvestor.name}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      name: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Company"
                  value={editingInvestor.company}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      company: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editingInvestor.email}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      email: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Investment Amount"
                  type="number"
                  value={editingInvestor.investmentAmount}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      investmentAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Last Contact"
                  type="date"
                  value={editingInvestor.lastContact}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      lastContact: e.target.value,
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={editingInvestor.notes}
                  onChange={(e) =>
                    setEditingInvestor({
                      ...editingInvestor,
                      notes: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingInvestor(null)}>Cancel</Button>
            <Button onClick={() => handleEditInvestor(editingInvestor)}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this investor?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (deleteConfirmation) {
                handleDeleteInvestor(deleteConfirmation);
                setDeleteConfirmation(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {showConfetti && <Confetti />}
    </Box>
  );
};

export default InvestmentPipeline;
