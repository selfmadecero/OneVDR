import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  minHeight: '500px',
}));

const InvestorCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
}));

const stages = [
  'Initial Contact',
  'Pitch Deck Sent',
  'Meeting Scheduled',
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
  stage: string;
  amount: number;
  notes: string;
}

const InvestmentPipeline: React.FC = () => {
  const [user] = useAuthState(auth);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newInvestor, setNewInvestor] = useState<Omit<Investor, 'id'>>({
    name: '',
    company: '',
    email: '',
    stage: 'Initial Contact',
    amount: 0,
    notes: '',
  });
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null
  );

  useEffect(() => {
    if (user) {
      const investorsRef = collection(db, 'users', user.uid, 'investors');
      const q = query(investorsRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const investorList: Investor[] = [];
        querySnapshot.forEach((doc) => {
          investorList.push({ id: doc.id, ...doc.data() } as Investor);
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
          stage: 'Initial Contact',
          amount: 0,
          notes: '',
        });
        setOpenDialog(false);
      } catch (error) {
        console.error('Error adding investor:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateInvestor = async (
    investorId: string,
    updates: Partial<Investor>
  ) => {
    if (user) {
      const investorRef = doc(db, 'users', user.uid, 'investors', investorId);
      await updateDoc(investorRef, updates);
    }
  };

  const handleDeleteInvestor = async (investorId: string) => {
    if (user) {
      const investorRef = doc(db, 'users', user.uid, 'investors', investorId);
      await deleteDoc(investorRef);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const investor = investors.find((inv) => inv.id === draggableId);
      if (investor) {
        handleUpdateInvestor(investor.id, { stage: destination.droppableId });
      }
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    investor: Investor
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvestor(investor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvestor(null);
  };

  const handleEditInvestor = () => {
    if (selectedInvestor) {
      setEditingInvestor(selectedInvestor);
      setOpenDialog(true);
    }
    handleMenuClose();
  };

  const handleDeleteSelectedInvestor = () => {
    if (selectedInvestor) {
      handleDeleteInvestor(selectedInvestor.id);
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Investment Pipeline
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ marginBottom: 2 }}
      >
        Add Investor
      </Button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {stages.map((stage) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={stage}>
              <StyledPaper>
                <Typography variant="h6" gutterBottom>
                  {stage}
                </Typography>
                <Droppable droppableId={stage}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {investors
                        .filter((investor) => investor.stage === stage)
                        .map((investor, index) => (
                          <Draggable
                            key={investor.id}
                            draggableId={investor.id}
                            index={index}
                          >
                            {(provided) => (
                              <InvestorCard
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    {investor.name}
                                  </Typography>
                                  <IconButton
                                    onClick={(e) => handleMenuOpen(e, investor)}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Box>
                                <Typography variant="body2">
                                  {investor.company}
                                </Typography>
                                <Chip
                                  label={`$${investor.amount.toLocaleString()}`}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </InvestorCard>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </StyledPaper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editingInvestor ? editingInvestor.name : newInvestor.name}
            onChange={(e) =>
              editingInvestor
                ? setEditingInvestor({
                    ...editingInvestor,
                    name: e.target.value,
                  })
                : setNewInvestor({ ...newInvestor, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Company"
            fullWidth
            value={
              editingInvestor ? editingInvestor.company : newInvestor.company
            }
            onChange={(e) =>
              editingInvestor
                ? setEditingInvestor({
                    ...editingInvestor,
                    company: e.target.value,
                  })
                : setNewInvestor({ ...newInvestor, company: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={editingInvestor ? editingInvestor.email : newInvestor.email}
            onChange={(e) =>
              editingInvestor
                ? setEditingInvestor({
                    ...editingInvestor,
                    email: e.target.value,
                  })
                : setNewInvestor({ ...newInvestor, email: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Amount"
            fullWidth
            type="number"
            value={
              editingInvestor ? editingInvestor.amount : newInvestor.amount
            }
            onChange={(e) =>
              editingInvestor
                ? setEditingInvestor({
                    ...editingInvestor,
                    amount: Number(e.target.value),
                  })
                : setNewInvestor({
                    ...newInvestor,
                    amount: Number(e.target.value),
                  })
            }
          />
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={editingInvestor ? editingInvestor.notes : newInvestor.notes}
            onChange={(e) =>
              editingInvestor
                ? setEditingInvestor({
                    ...editingInvestor,
                    notes: e.target.value,
                  })
                : setNewInvestor({ ...newInvestor, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (editingInvestor) {
                handleUpdateInvestor(editingInvestor.id, editingInvestor);
              } else {
                handleAddInvestor();
              }
              setOpenDialog(false);
              setEditingInvestor(null);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : editingInvestor ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditInvestor}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteSelectedInvestor}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default InvestmentPipeline;
