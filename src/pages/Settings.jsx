import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode } from '../features/uiSlice';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ShieldIcon from '@mui/icons-material/Shield';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { darkMode } = useSelector(state => state.ui);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: '#1565C0', fontSize: 28 }}>{user?.name?.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Chip label={user?.role?.name} size="small" color="primary" icon={<ShieldIcon />} />
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2">{user?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2">{user?.phone || 'Not set'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Appearance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DarkModeIcon color="action" />
                  <Box>
                    <Typography variant="body1">Dark Mode</Typography>
                    <Typography variant="body2" color="text.secondary">Toggle dark theme</Typography>
                  </Box>
                </Box>
                <Switch checked={darkMode} onChange={() => dispatch(toggleDarkMode())} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Permissions</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user?.role?.permissions?.map(p => (
                  <Chip key={p._id} label={p.name} size="small" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Settings;
