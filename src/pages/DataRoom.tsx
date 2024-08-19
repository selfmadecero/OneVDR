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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import { auth, db, storage } from '../services/firebase';
import { FileInfo, User } from '../types';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import ProjectList from '../components/ProjectList';
import FolderView from '../components/FolderView';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { SelectChangeEvent } from '@mui/material/Select';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
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

interface Project {
  id: string;
  name: string;
  category: string;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

const DataRoom: React.FC = () => {
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Project A', category: 'Development' },
    { id: '2', name: 'Project B', category: 'Marketing' },
  ]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

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

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    // 프로젝트에 해당하는 폴더와 파일을 불러오는 로직 추가
  };

  const handleFolderSelect = (folder: Folder) => {
    setCurrentFolder(folder);
    // 선택된 폴더의 하위 폴더와 파일을 불러오는 로직 추가
  };

  const handleFileSelect = (file: FileInfo) => {
    // 파일 선택 시 ���작 추가 (예: 파일 상세 정보 표시)
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: 'bold', color: '#333', textAlign: 'center' }}
      >
        Data Room
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
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
        </Grid>
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={0} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
              Filter and Search
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryToggle(category)}
                  variant={
                    selectedCategories.includes(category)
                      ? 'filled'
                      : 'outlined'
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
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </StyledPaper>
        </Grid>
      </Grid>
      <StyledPaper elevation={0} sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#555', mb: 2 }}>
          Projects
        </Typography>
        <ProjectList
          projects={projects}
          onProjectSelect={handleProjectSelect}
        />
      </StyledPaper>
      <StyledPaper elevation={0}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: '#555' }}>
            {selectedProject ? `Files in ${selectedProject.name}` : 'All Files'}
          </Typography>
          <FormControl variant="outlined" size="small">
            <InputLabel id="sort-select-label">Sort by</InputLabel>
            <Select
              labelId="sort-select-label"
              value={sortOption}
              onChange={handleSortChange}
              label="Sort by"
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="size">Size</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <FileList files={sortedFiles} onDeleteFile={handleDeleteFile} />
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
