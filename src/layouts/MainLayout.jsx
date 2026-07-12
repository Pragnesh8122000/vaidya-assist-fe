import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import Button from '@mui/material/Button';
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
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssessmentIcon from '@mui/icons-material/Assessment';
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
import DescriptionIcon from '@mui/icons-material/Description';
import Chip from '@mui/material/Chip';
import LockOutlineIcon from '@mui/icons-material/LockOutline';
import { logout, exitGuestMode } from '../features/authSlice';
import { toggleSidebar, toggleDarkMode } from '../features/uiSlice';
import { openChat as openAgentChat } from '../features/agentChatSlice';
import api from '../api/axios';
import AgentChatWidget from '../components/AgentChatWidget';
import { ROLES, ALL_STAFF_ROLES, resolveRoleSlug } from '../types/auth';
import { GUEST_RESTRICTED_ROUTES, GUEST_RESTRICTION_MESSAGES } from '../constants/guestData';

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 72;

// Menu items use the typed ROLES constants. The route guard in App.jsx
// uses the same allowlists, so a route a user can navigate to is one
// they will see in the menu (ARCH-4 follow-up: see audit phase plan).
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ALL_STAFF_ROLES },
  { text: 'Appointments', icon: <CalendarMonthIcon />, path: '/appointments', roles: ALL_STAFF_ROLES },
  { text: 'Patients', icon: <PeopleIcon />, path: '/patients', roles: ALL_STAFF_ROLES },
  { text: 'Doctors', icon: <PersonIcon />, path: '/doctors', roles: [ROLES.DOCTOR, ROLES.ASSISTANT] },
  { text: 'Medicines', icon: <MedicalServicesIcon />, path: '/medicines', roles: ALL_STAFF_ROLES },
  { text: 'Templates', icon: <DescriptionIcon />, path: '/templates', roles: [ROLES.DOCTOR] },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: [ROLES.DOCTOR, ROLES.ASSISTANT] },
  { text: 'Agent', icon: <SmartToyIcon />, path: '/agent', roles: [ROLES.DOCTOR, ROLES.ASSISTANT] },
  { text: 'Assistants', icon: <GroupAddIcon />, path: '/assistants', roles: [ROLES.DOCTOR] },
  { text: 'Roles', icon: <AdminPanelSettingsIcon />, path: '/roles', roles: [ROLES.DOCTOR] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ALL_STAFF_ROLES },
];

// Resolve the role slug from the user object via the shared helper so
// the route guard, menu filter, and HomeRoute all agree.
const roleSlug = resolveRoleSlug;

const visibleMenuItems = (user) => {
  const slug = roleSlug(user);
  // Unknown/missing role: show everything (preserves prior admin/staff access).
  if (!slug) return menuItems;
  return menuItems.filter((item) => item.roles.includes(slug));
};

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isGuest } = useSelector((state) => state.auth);
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isGuest) fetchNotifications();
  }, [isGuest]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=5');
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      // SEC-5 fix: never log the full axios error object — it can include
      // the bearer token, request URL with auth headers, and patient
      // identifiers embedded in error messages. Swallow silently; the
      // notification badge simply shows zero.
    }
  };

  const handleLogout = () => {
    if (isGuest) {
      dispatch(exitGuestMode());
    } else {
      dispatch(logout());
    }
    navigate('/login');
  };

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : MINI_WIDTH;
  const items = visibleMenuItems(user);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64 }}>
        {sidebarOpen && (
          <>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MedicalServicesIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ color: 'primary.main' }}>
              Vaidya Assist
            </Typography>
            {isGuest && sidebarOpen && (
              <Chip label="Demo" size="small" color="warning" variant="outlined" sx={{ ml: 0.5, fontSize: '0.65rem', height: 20 }} />
            )}
          </>
        )}
        {!isMobile && (
          <IconButton onClick={() => dispatch(toggleSidebar())} sx={{ ml: 'auto' }} size="small" aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}>
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Box>
      <Divider />
      {/* A11Y-2 fix: <nav> + aria-label turn the menu list into a
          landmark screen readers can jump to. aria-current="page" on
          the active item tells assistive tech where the user is. */}
      <List component="nav" aria-label="Main navigation" sx={{ flex: 1, px: 1, py: 1 }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const isRestricted = isGuest && GUEST_RESTRICTED_ROUTES.includes(item.path);
          return (
            <Tooltip key={item.text} title={!sidebarOpen ? item.text : isRestricted ? `${item.text} (sign in required)` : ''} placement="right">
              <ListItemButton
                onClick={() => {
                  if (isRestricted) {
                    const msg = GUEST_RESTRICTION_MESSAGES[item.path] || GUEST_RESTRICTION_MESSAGES.default;
                    import('react-toastify').then(({ toast }) => toast.info(`${msg.title}. Sign in to access.`, { autoClose: 4000 }));
                    return;
                  }
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  borderRadius: 2, mb: 0.5, minHeight: 44,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  opacity: isRestricted ? 0.6 : 1,
                  '&.Mui-selected': {
                    bgcolor: 'action.hover',
                    borderLeft: '4px solid',
                    borderColor: 'secondary.main',
                    pl: '12px',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                    '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 600 },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: sidebarOpen ? 40 : 0, justifyContent: 'center' }}>
                  {isRestricted ? <LockOutlineIcon sx={{ fontSize: 20 }} /> : item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14 }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>{user?.name?.charAt(0)}</Avatar>
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
      {/* A11Y-2 fix: skip-to-content link. The link is the first focusable
          element on the page and jumps focus past the navigation
          straight to the page <main>. Visually hidden until it
          receives focus (`:focus`) so it doesn't clutter the UI. */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
          '&:focus': {
            position: 'fixed',
            left: 16,
            top: 16,
            width: 'auto',
            height: 'auto',
            zIndex: 9999,
            bgcolor: 'background.paper',
            color: 'primary.main',
            p: 1.5,
            borderRadius: 1,
            outline: 2,
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        Skip to main content
      </Box>
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
        <AppBar component="header" position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} aria-label="Open navigation"><MenuIcon /></IconButton>}
            {/* A11Y-2 fix: the page-title H1 makes the current section a
                proper heading landmark for screen-reader rotor nav. */}
            <Typography component="h1" variant="h6" color="text.primary" fontWeight={600} sx={{ flex: 1 }}>
              {items.find(i => i.path === location.pathname)?.text || 'Vaidya Assist'}
            </Typography>

            <IconButton onClick={() => dispatch(toggleDarkMode())} sx={{ mr: 1 }} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ mr: 1 }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
              <Badge badgeContent={unreadCount} color="error"><NotificationsIcon /></Badge>
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

            <Button
              variant="contained"
              size="small"
              startIcon={<MedicalServicesIcon />}
              onClick={() => {
                if (isGuest) {
                  import('react-toastify').then(({ toast }) => toast.info('Sign in to use the AI assistant.', { autoClose: 3000 }));
                  return;
                }
                dispatch(openAgentChat());
              }}
              disabled={isGuest}
              sx={{ mr: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 1.5 }}
            >
              {isGuest ? 'Demo' : 'Assistant'}
            </Button>

            <IconButton onClick={(e) => setUserAnchor(e.currentTarget)} aria-label="Account menu">
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{user?.name?.charAt(0)}</Avatar>
            </IconButton>

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

        {/* A11Y-2 fix: target the skip-link's `#main-content` hash and
            turn the main region into a labelled landmark. */}
        <Box component="main" id="main-content" tabIndex={-1} aria-label="Main content" sx={{ flex: 1, overflow: 'auto', p: 3, outline: 'none' }}>
          {isGuest && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <Chip label="Demo Mode" color="warning" size="small" sx={{ fontWeight: 600 }} />
              <Typography variant="body2" color="text.secondary">
                You're exploring with sample data. <Button size="small" variant="text" sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontWeight: 600, color: 'warning.dark' }} onClick={() => { dispatch(exitGuestMode()); navigate('/login'); }}>Sign in</Button> for full access.
              </Typography>
            </Box>
          )}
          <Outlet />
        </Box>

        {!isGuest && <AgentChatWidget />}
      </Box>
    </Box>
  );
};

export default MainLayout;
