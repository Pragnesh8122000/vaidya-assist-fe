import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { register, clearError } from '../features/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (result.type === 'auth/register/fulfilled') navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 30%, #42A5F5 70%, #90CAF9 100%)' }}>
      <Card sx={{ width: 420, mx: 2, overflow: 'visible', position: 'relative' }}>
        <Box sx={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1565C0, #42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 4px 20px rgba(21,101,192,0.4)' }}>
          <LocalHospitalIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>
        <CardContent sx={{ pt: 6, px: 4, pb: 4 }}>
          <Typography variant="h5" textAlign="center" fontWeight={700} gutterBottom>Create Account</Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>Register as a Doctor</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> } }} />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> } }} />
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment> } }} />
            <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required sx={{ mb: 3 }}
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
              } }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: '1rem' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
            Already have an account?{' '}<Link to="/login" style={{ color: '#1565C0', fontWeight: 600 }}>Sign In</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
