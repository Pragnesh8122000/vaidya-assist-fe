import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { getDoctors } from '../api/doctors';
import { GUEST_DOCTORS } from '../constants/guestData';

const Doctors = () => {
  const { isGuest } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isGuest) {
      const filtered = search
        ? GUEST_DOCTORS.filter((d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase()))
        : GUEST_DOCTORS;
      setDoctors(filtered);
      setCount(filtered.length);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getDoctors({ search });
        if (!cancelled) {
          setDoctors(result.data || []);
          setCount(result.count || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load doctors');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, isGuest]);

  return (
    <Box sx={{ pt: 2, pb: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <MedicalServicesIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Doctors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {count} doctor{count !== 1 ? 's' : ''} available
          </Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search doctors by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 500 }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {doctors.length === 0 ? (
            <Grid size={12}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No doctors found.
                </Typography>
              </Card>
            </Grid>
          ) : (
            doctors.map((doctor) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={doctor._id}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {doctor.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Dr. {doctor.name}
                        </Typography>
                        <Chip
                          label={doctor.role?.name || 'Doctor'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    {doctor.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {doctor.email}
                        </Typography>
                      </Box>
                    )}
                    {doctor.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {doctor.phone}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Doctors;
