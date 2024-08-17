import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import Auth from './pages/Auth';
import DataRoom from './pages/DataRoom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Box } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideSidebar = ['/', '/auth'].includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      {!hideSidebar && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: 10,
          mt: 0,
          ml: 0,
          width: '100%',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dataroom" element={<DataRoom />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;
