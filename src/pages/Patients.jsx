import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', address: '', bloodGroup: '' });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/patients', { params });
      setPatients(data.data);
      setTotal(data.pagination.total);
    } catch (err) { toast.error('Failed to load patients'); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : undefined };
      if (editing) {
        await api.put(`/patients/${editing._id}`, payload);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient created');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: '', age: '', gender: '', phone: '', email: '', address: '', bloodGroup: '' });
      fetchPatients();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, age: p.age || '', gender: p.gender || '', phone: p.phone || '', email: p.email || '', address: p.address || '', bloodGroup: p.bloodGroup || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient?')) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleAddNote = async () => {
    try {
      await api.post(`/patients/${selectedPatient._id}/notes`, { note });
      toast.success('Note added');
      setNoteDialog(false);
      setNote('');
      fetchPatients();
    } catch (err) { toast.error('Failed to add note'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Patients</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '', age: '', gender: '', phone: '', email: '', address: '', bloodGroup: '' }); setDialogOpen(true); }}>
          New Patient
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField size="small" placeholder="Search by name, phone, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} sx={{ minWidth: 300 }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Blood Group</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : patients.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No patients found</TableCell></TableRow>
              ) : (
                patients.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>{p.gender}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell><Chip label={p.bloodGroup || 'N/A'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{p.medicalNotes?.length || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setSelectedPatient(p); setNoteDialog(true); }}><NoteAddIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleEdit(p)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(p._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={10} rowsPerPageOptions={[10]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Patient' : 'New Patient'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Grid>
            <Grid size={{ xs: 4 }}>
              <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField select fullWidth label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Medical Notes - {selectedPatient?.name}</DialogTitle>
        <DialogContent>
          {selectedPatient?.medicalNotes?.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle2">Previous Notes ({selectedPatient.medicalNotes.length})</Typography></AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {selectedPatient.medicalNotes.map((n, i) => (
                    <ListItem key={i}><ListItemText primary={n.note} secondary={new Date(n.createdAt).toLocaleDateString()} /></ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
          <TextField fullWidth label="New Note" multiline rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!note}>Add Note</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;
