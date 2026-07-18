import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { getDoctors, setDoctorsSearch, clearDoctorsError } from '../features/doctorsSlice';
import { GUEST_DOCTORS } from '../constants/guestData';

const SEARCH_DEBOUNCE_MS = 300;

const Doctors = () => {
  const dispatch = useDispatch();
  const { isGuest } = useSelector((state) => state.auth);
  const { data: doctors, count, loading, error, search } = useSelector((state) => state.doctors);

  useEffect(() => {
    if (isGuest) {
      // Guest mode uses static sample data, no API call.
      dispatch(setDoctorsSearch(''));
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) dispatch(getDoctors({ search }));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, isGuest, dispatch]);

  const handleSearchChange = (e) => {
    dispatch(setDoctorsSearch(e.target.value));
  };

  const displayedDoctors = isGuest
    ? GUEST_DOCTORS.filter((d) =>
        search
          ? d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase())
          : true,
      )
    : doctors;
  const displayedCount = isGuest ? displayedDoctors.length : count;

  return (
    <Box sx={{ pt: 2, pb: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <MedicalServicesIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Doctors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {displayedCount} doctor{displayedCount !== 1 ? 's' : ''} available
          </Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search doctors by name or email..."
        value={search}
        onChange={handleSearchChange}
        sx={{ mb: 3, maxWidth: 500 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearDoctorsError())}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayedDoctors.length === 0 ? (
            <Grid size={12}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No doctors found.
                </Typography>
              </Card>
            </Grid>
          ) : (
            displayedDoctors.map((doctor) => (
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
