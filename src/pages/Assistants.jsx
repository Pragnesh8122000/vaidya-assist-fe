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
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-toastify';
import api from '../api/axios';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { EMPTY_USER_FORM } from '../types/forms';

const Assistants = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_USER_FORM });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/users?limit=50'); setUsers(data.data); }
    catch (err) { toast.error('Failed to load users'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); api.get('/users/roles').then(r => setRoles(r.data.data)).catch(() => {}); }, [fetchUsers]);

  const handleSubmit = async () => {
    try {
      if (editing) {
        await api.put(`/users/${editing._id}`, { name: form.name, phone: form.phone, role: form.role });
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setDialogOpen(false); setEditing(null); setForm({ ...EMPTY_USER_FORM });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role?._id || '' });
    setDialogOpen(true);
  };

  const handleToggleActive = async (u) => {
    try { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`); fetchUsers(); }
    catch (err) { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/users/${deleteTarget}`); toast.success('User deleted'); fetchUsers(); }
    catch (err) { toast.error('Failed to delete'); }
    finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Assistants &amp; Staff</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setEditing(null); setForm({ ...EMPTY_USER_FORM }); setDialogOpen(true); }}>Add User</Button>
      </Box>
      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Username</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              : users.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Tooltip title={u.username ? 'Click to copy' : 'No username yet'} placement="top">
                      <Box
                        component="code"
                        onClick={() => u.username && navigator.clipboard?.writeText(u.username)}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: 12,
                          cursor: u.username ? 'pointer' : 'default',
                          color: u.username ? 'text.primary' : 'text.disabled',
                          '&:hover': u.username ? { color: 'primary.main' } : undefined,
                        }}
                      >
                        {u.username || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell><Chip label={u.role?.name || 'N/A'} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell><Switch checked={u.isActive} onChange={() => handleToggleActive(u)} size="small" /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(u)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(u._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            {!editing && <Grid size={{ xs: 12 }}><TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Grid>}
            <Grid size={{ xs: 12 }}>
              <TextField select fullWidth label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                {roles.map(r => <MenuItem key={r._id} value={r._id}>{r.name} — {r.description}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message="This user will lose access to the clinic. Their past activity (appointments, notes) is retained for audit."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </Box>
  );
};
export default Assistants;
