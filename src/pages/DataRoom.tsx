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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import { auth, db, storage } from '../services/firebase';
import { FileInfo, User } from '../types';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '&.MuiChip-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
  },
  '&.MuiChip-filled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
}));

const DataRoom: React.FC = () => {
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFiles(newFiles);
        setCategories(Array.from(newCategories));
      });
      return unsubscribe;
    }
  }, [user]);

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

  return (
    <Box sx={{ width: '100%', p: 3, backgroundColor: '#f5f7fa' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
      >
        Data Room
      </Typography>
      <StyledPaper elevation={0} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
          Upload Documents
        </Typography>
        <FileUpload
          onFileUploaded={handleFileUploaded}
          setIsLoading={setIsLoading}
          setError={setError}
          user={user as User}
        />
      </StyledPaper>
      <StyledPaper elevation={0} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
          Filter by Category
        </Typography>
        <Box sx={{ mb: 2 }}>
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              onClick={() => handleCategoryToggle(category)}
              variant={
                selectedCategories.includes(category) ? 'filled' : 'outlined'
              }
            />
          ))}
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </StyledPaper>
      <StyledPaper elevation={0}>
        <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
          Your Files
        </Typography>
        <FileList files={filteredFiles} onDeleteFile={handleDeleteFile} />
      </StyledPaper>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DataRoom;
