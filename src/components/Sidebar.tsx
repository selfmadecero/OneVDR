import { Description, Mail as MailIcon, TrendingUp } from '@mui/icons-material';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          mt: 8,
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <List>
        <ListItem
          button
          onClick={() => navigate('/dataroom')}
          sx={{
            backgroundColor: isActive('/dataroom')
              ? 'rgba(33, 150, 243, 0.1)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
          }}
        >
          <ListItemIcon>
            <Description
              sx={{ color: isActive('/dataroom') ? '#2196f3' : 'inherit' }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Data Room"
            primaryTypographyProps={{
              fontWeight: isActive('/dataroom') ? 'bold' : 'medium',
              color: isActive('/dataroom') ? '#2196f3' : 'inherit',
            }}
          />
        </ListItem>
        <ListItem
          button
          onClick={() => navigate('/mail')}
          sx={{
            backgroundColor: isActive('/mail')
              ? 'rgba(33, 150, 243, 0.1)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
          }}
        >
          <ListItemIcon>
            <MailIcon
              sx={{ color: isActive('/mail') ? '#2196f3' : 'inherit' }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Mail"
            primaryTypographyProps={{
              fontWeight: isActive('/mail') ? 'bold' : 'medium',
              color: isActive('/mail') ? '#2196f3' : 'inherit',
            }}
          />
        </ListItem>
        <ListItem
          button
          onClick={() => navigate('/investment-pipeline')}
          sx={{
            backgroundColor: isActive('/investment-pipeline')
              ? 'rgba(33, 150, 243, 0.1)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
          }}
        >
          <ListItemIcon>
            <TrendingUp
              sx={{
                color: isActive('/investment-pipeline') ? '#2196f3' : 'inherit',
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Investment Pipeline"
            primaryTypographyProps={{
              fontWeight: isActive('/investment-pipeline') ? 'bold' : 'medium',
              color: isActive('/investment-pipeline') ? '#2196f3' : 'inherit',
            }}
          />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
