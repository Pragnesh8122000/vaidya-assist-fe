import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FolderIcon from '@mui/icons-material/Folder';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { toggleSidebar, toggleDarkMode } from '../features/uiSlice';
import api from '../api/axios';
import AgentChatWidget from '../components/AgentChatWidget';

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 72;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Appointments', icon: <CalendarMonthIcon />, path: '/appointments' },
  { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
  { text: 'Medicines', icon: <MedicalServicesIcon />, path: '/medicines' },
  { text: 'Files', icon: <FolderIcon />, path: '/files' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Chat', icon: <ChatIcon />, path: '/chat' },
  { text: 'Agent', icon: <SmartToyIcon />, path: '/agent' },
  { text: 'Assistants', icon: <GroupAddIcon />, path: '/assistants' },
  { text: 'Roles', icon: <AdminPanelSettingsIcon />, path: '/roles' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=5');
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err) { /* ignore */ }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : MINI_WIDTH;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64 }}>
        {sidebarOpen && (
          <>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #1565C0, #42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MedicalServicesIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ background: 'linear-gradient(135deg, #1565C0, #42A5F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Vaidya Assist
            </Typography>
          </>
        )}
        {!isMobile && (
          <IconButton onClick={() => dispatch(toggleSidebar())} sx={{ ml: 'auto' }} size="small">
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={!sidebarOpen ? item.text : ''} placement="right">
            <ListItemButton
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2, mb: 0.5, minHeight: 44,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(21,101,192,0.12), rgba(66,165,245,0.12))',
                  '& .MuiListItemIcon-root': { color: '#1565C0' },
                  '& .MuiListItemText-primary': { color: '#1565C0', fontWeight: 600 },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 40 : 0, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14 }} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#1565C0', fontSize: 14 }}>{user?.name?.charAt(0)}</Avatar>
        {sidebarOpen && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.role?.name}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{
          width: drawerWidth, flexShrink: 0, transition: 'width 0.3s',
          '& .MuiDrawer-paper': { width: drawerWidth, transition: 'width 0.3s', overflowX: 'hidden', borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }
        }}>
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}><MenuIcon /></IconButton>}
            <Typography variant="h6" color="text.primary" fontWeight={600} sx={{ flex: 1 }}>
              {menuItems.find(i => i.path === location.pathname)?.text || 'Vaidya Assist'}
            </Typography>

            <IconButton onClick={() => dispatch(toggleDarkMode())} sx={{ mr: 1 }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ mr: 1 }}>
              <Badge badgeContent={unreadCount} color="error"><NotificationsIcon /></Badge>
            </IconButton>

            <IconButton onClick={(e) => setUserAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565C0', fontSize: 14 }}>{user?.name?.charAt(0)}</Avatar>
            </IconButton>

            <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)} slotProps={{ paper: { sx: { width: 320, maxHeight: 400 } } }}>
              <Box sx={{ px: 2, py: 1 }}><Typography variant="subtitle1" fontWeight={600}>Notifications</Typography></Box>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem disabled><Typography variant="body2">No notifications</Typography></MenuItem>
              ) : (
                notifications.map((n) => (
                  <MenuItem key={n._id} onClick={() => setNotifAnchor(null)} sx={{ whiteSpace: 'normal' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={n.read ? 400 : 600}>{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setUserAnchor(null); navigate('/settings'); }}><SettingsIcon sx={{ mr: 1, fontSize: 18 }} />Settings</MenuItem>
              <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1, fontSize: 18 }} />Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>

        <AgentChatWidget />
      </Box>
    </Box>
  );
};

export default MainLayout;
