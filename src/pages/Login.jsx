import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { login, clearError } from '../features/authSlice';
import ParticleBackground from '../components/ParticleBackground';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (result.type === 'auth/login/fulfilled') navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, delay: 0.3 + i * 0.1 }
    })
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, delay: 0.5 }
    },
    hover: {
      scale: 1.03,
      boxShadow: '0 8px 25px rgba(21,101,192,0.4)',
      transition: { duration: 0.2 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.8, ease: 'backOut' }
    }
  };

  return (
    <Box ref={containerRef} component={motion.div} variants={containerVariants} initial="hidden" animate="visible"
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 30%, #42A5F5 70%, #90CAF9 100%)' }}>
      <ParticleBackground mousePosition={mousePosition} />

      <Card component={motion.div} variants={cardVariants} initial="hidden" animate="visible"
        sx={{ width: 420, mx: 2, overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <Box component={motion.div} variants={logoVariants} initial="hidden" animate="visible"
          sx={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -36, left: '50%',
            transform: 'translateX(-50%)', boxShadow: '0 4px 20px rgba(21,101,192,0.4)' }}>
          <LocalHospitalIcon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>
        <CardContent sx={{ pt: 6, px: 4, pb: 4 }}>
          <Typography variant="h5" textAlign="center" fontWeight={700} gutterBottom>Welcome Back</Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>Sign in to Vaidya Assist</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <motion.div variants={inputVariants} custom={0}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> } }} />
            </motion.div>
            <motion.div variants={inputVariants} custom={1}>
              <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required sx={{ mb: 3 }}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                } }} />
            </motion.div>
            <motion.div variants={buttonVariants} initial="hidden" animate="visible" whileHover="hover">
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: '1rem' }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </motion.div>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
            Don&apos;t have an account?{' '}<Link to="/register" style={{ color: '#1565C0', fontWeight: 600 }}>Register</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
