import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
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
import Divider from '@mui/material/Divider';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { login, clearError, googleLogin } from '../features/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!form.email || !form.password) {
      return;
    }
    try {
      await dispatch(login(form)).unwrap();
    } catch (err) {
      // Error toast is shown by the slice
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;
    dispatch(clearError());
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
    } catch {
      // Error toast is shown by the slice — includes the specific "No account
      // found for this email. Please contact your administrator." message.
    }
  };

  const handleGoogleError = () => {
    // User cancelled the Google popup or the flow was interrupted.
    // No error message needed — just return to the login form.
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, delay: 0.3 + i * 0.1 },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, delay: 0.5 },
    },
    hover: {
      scale: 1.03,
      boxShadow: '0 8px 25px rgba(33,28,22,0.18)',
      transition: { duration: 0.2 },
    },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.8, ease: 'backOut' },
    },
  };

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Card
        component={motion.div}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        sx={{
          width: { xs: 'calc(100% - 32px)', sm: 440 },
          maxWidth: 440,
          mx: 2,
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
          borderTop: '4px solid #C8862A',
        }}
      >
        <Box
          component={motion.div}
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 20px rgba(33,28,22,0.2)',
          }}
        >
          <LocalHospitalIcon sx={{ fontSize: 36, color: 'primary.contrastText' }} />
        </Box>

        <CardContent sx={{ pt: 6, px: 4, pb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontWeight: 700, textAlign: 'center' }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
            Sign in to Vaidya Clinic Portal
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {String(error)}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box component={motion.div} variants={inputVariants} custom={0} initial="hidden" animate="visible">
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                sx={{ mb: 2.5 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box component={motion.div} variants={inputVariants} custom={1} initial="hidden" animate="visible">
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                sx={{ mb: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          // A11Y-8 fix: the icon-only password toggle has
                          // no text label, so screen readers announce
                          // nothing. A descriptive aria-label that flips
                          // with the toggle state lets SR users confirm
                          // what will happen on activation.
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box component={motion.div} variants={buttonVariants} initial="hidden" animate="visible" whileHover="hover">
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', mt: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }}>or</Divider>

          {/* Google Sign-In button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="rectangular"
              size="large"
              width="340"
            />
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
            Your data is encrypted and secure
          </Typography>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: '#3D5A4C', fontWeight: 600 }}>
              Register
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
