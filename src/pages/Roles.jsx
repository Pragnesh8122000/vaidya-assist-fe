import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShieldIcon from '@mui/icons-material/Shield';
import { toast } from 'react-toastify';
import api from '../api/axios';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { EMPTY_ROLE_FORM } from '../types/forms';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ROLE_FORM });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoles();
    api.get('/users/permissions').then(r => setPermissions(r.data.data)).catch(() => {});
  }, []);

  const fetchRoles = async () => {
    try { setLoading(true); const { data } = await api.get('/users/roles'); setRoles(data.data); }
    catch (err) { toast.error('Failed to load roles'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await api.put(`/users/roles/${editing._id}`, form);
        toast.success('Role updated');
      } else {
        await api.post('/users/roles', form);
        toast.success('Role created');
      }
      setDialogOpen(false); setEditing(null); setForm({ ...EMPTY_ROLE_FORM });
      fetchRoles();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, slug: r.slug, description: r.description || '', permissions: r.permissions.map(p => p._id) });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/users/roles/${deleteTarget}`); toast.success('Role deleted'); fetchRoles(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
    finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const togglePermission = (permId) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId) ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, p) => { (acc[p.module] = acc[p.module] || []).push(p); return acc; }, {});

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles &amp; Permissions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ ...EMPTY_ROLE_FORM }); setDialogOpen(true); }}>Add Role</Button>
      </Box>
      <Grid container spacing={3}>
        {roles.map(role => (
          <Grid size={{ xs: 12, md: 6 }} key={role._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon color="primary" />
                    <Box>
                      <Typography variant="h6">{role.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(role)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(role._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {role.permissions.map(p => (
                    <Chip key={p._id} label={p.name} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>Permissions</Typography>
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <Box key={module} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{module}</Typography>
                  <FormGroup row>
                    {perms.map(p => (
                      <FormControlLabel key={p._id} control={<Checkbox size="small" checked={form.permissions.includes(p._id)} onChange={() => togglePermission(p._id)} />} label={p.name} />
                    ))}
                  </FormGroup>
                </Box>
              ))}
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
        title="Delete role"
        message="Users with this role will lose its permissions immediately. They will fall back to the role's default until reassigned."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </Box>
  );
};
export default Roles;
