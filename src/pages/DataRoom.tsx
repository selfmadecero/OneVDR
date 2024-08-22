import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled, useTheme } from '@mui/material/styles';
import { auth, db, storage } from '../services/firebase';
import { FileInfo, User, DataRoomStats, ActivityLog } from '../types';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import { getDocs, QueryDocumentSnapshot } from 'firebase/firestore';

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

const CategoryChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  transition: 'all 0.2s ease-in-out',
  '&.MuiChip-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
  },
  '&.MuiChip-filled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

type SortOption = 'name' | 'date' | 'size';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

const DataRoom: React.FC = () => {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  const [investorId, setInvestorId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const filesRef = collection(db, 'users', user.uid, 'files');
      const q = query(filesRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newFiles: FileInfo[] = [];
        const newCategories = new Set<string>();
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<FileInfo, 'id'>;
          newFiles.push({ ...data, id: doc.id } as FileInfo);
          if (typeof data.analysis === 'object' && data.analysis.categories) {
            data.analysis.categories.forEach((category) =>
              newCategories.add(category)
            );
          }
        });
        console.log('Fetched files:', newFiles); // Added console log
        setFiles(newFiles);
        setCategories(Array.from(newCategories));
      });
      return unsubscribe;
    }
  }, [user]);

  useEffect(() => {
    // URL에서 investorId를 가져옵니다.
    const params = new URLSearchParams(window.location.search);
    const id = params.get('investorId');
    setInvestorId(id);

    if (id) {
      // 투자사의 활동 로그를 가져옵니다.
      fetchActivityLog(id).then(setActivityLog);
    }
  }, []);

  const fetchActivityLog = async (
    investorId: string
  ): Promise<ActivityLog[]> => {
    const logsRef = collection(db, 'activityLogs', investorId, 'logs');
    const logsSnapshot = await getDocs(logsRef);
    return logsSnapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as ActivityLog
    );
  };

  const logActivity = async (action: string, fileId: string) => {
    if (investorId) {
      const newActivity = {
        timestamp: new Date().toISOString(),
        action,
        fileId,
      };
      await addDoc(
        collection(db, 'activityLogs', investorId, 'logs'),
        newActivity
      );
      setActivityLog([...activityLog, newActivity]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredFiles = files.filter((file) => {
    const matchesCategories =
      selectedCategories.length === 0 ||
      (typeof file.analysis === 'object' &&
        file.analysis.categories &&
        file.analysis.categories.some((category) =>
          selectedCategories.includes(category)
        ));
    const matchesSearch =
      searchTerm === '' ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategories && matchesSearch;
  });

  const handleFileUploaded = (fileInfo: FileInfo) => {
    setFiles((prevFiles) => {
      const index = prevFiles.findIndex((f) => f.id === fileInfo.id);
      if (index !== -1) {
        const newFiles = [...prevFiles];
        newFiles[index] = fileInfo;
        return newFiles;
      }
      return [...prevFiles, fileInfo];
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'files', fileId));
      const storageRef = ref(storage, `users/${user.uid}/pdfs/${fileId}`);
      await deleteObject(storageRef);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortOption(event.target.value as SortOption);
  };

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortOption) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      case 'size':
        return parseInt(b.size) - parseInt(a.size);
      default:
        return 0;
    }
  });

  const handleFileSelect = (file: FileInfo) => {
    logActivity('viewed', file.id);
    // 파일 선택 시 추가 작업
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Upload Documents
        </Typography>
        <FileUpload
          onFileUploaded={handleFileUploaded}
          setIsLoading={setIsLoading}
          setError={setError}
          user={user as User}
          currentFolder={currentFolder?.id || null}
        />
      </StyledPaper>

      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Filter and Search
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryToggle(category)}
                  color={
                    selectedCategories.includes(category)
                      ? 'primary'
                      : 'default'
                  }
                  variant={
                    selectedCategories.includes(category)
                      ? 'filled'
                      : 'outlined'
                  }
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortOption}
                onChange={handleSortChange}
                label="Sort by"
                sx={{ borderRadius: '50px' }}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="size">Size</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </StyledPaper>

      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          All Files
        </Typography>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <FileList
            files={sortedFiles}
            onDeleteFile={handleDeleteFile}
            onSelectFile={handleFileSelect}
          />
        )}
      </StyledPaper>

      {investorId && (
        <StyledPaper>
          <Typography variant="h6">Activity Log</Typography>
          <List>
            {activityLog.map((activity, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${activity.action} file ${activity.fileId}`}
                  secondary={new Date(activity.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </StyledPaper>
      )}
    </Box>
  );
};

export default DataRoom;
