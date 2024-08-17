import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: '#333',
            cursor: 'pointer',
            fontWeight: 'bold',
            '&:hover': {
              color: '#2196f3',
            },
          }}
          onClick={() => navigate('/')}
        >
          OneVDR
        </Typography>
        {user ? (
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              color: '#333',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
              },
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            color="primary"
            variant="contained"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
