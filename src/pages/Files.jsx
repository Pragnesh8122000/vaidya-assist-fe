import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import api from '../api/axios';

const fileTypes = ['Medical Report', 'Prescription', 'Lab Result', 'Scan', 'Other'];
const typeColors = { 'Medical Report': 'primary', 'Prescription': 'secondary', 'Lab Result': 'info', 'Scan': 'warning', 'Other': 'default' };

const Files = () => {
  const [files, setFiles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [uploadForm, setUploadForm] = useState({ file: null, patient: '', type: 'Other', description: '' });

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/files', { params });
      setFiles(data.data);
      setTotal(data.pagination.total);
    } catch (err) { toast.error('Failed to load files'); }
    setLoading(false);
  }, [page, typeFilter]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { api.get('/patients?limit=100').then(r => setPatients(r.data.data)).catch(() => {}); }, []);

  const handleUpload = async () => {
    if (!uploadForm.file) return toast.error('Select a file');
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    if (uploadForm.patient) formData.append('patient', uploadForm.patient);
    formData.append('type', uploadForm.type);
    formData.append('description', uploadForm.description);
    try {
      await api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      setDialogOpen(false);
      setUploadForm({ file: null, patient: '', type: 'Other', description: '' });
      fetchFiles();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
  };

  const handleDownload = async (file) => {
    try {
      const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { toast.error('Download failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await api.delete(`/files/${id}`); toast.success('File deleted'); fetchFiles(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const formatSize = (bytes) => { if (!bytes) return 'N/A'; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / 1048576).toFixed(1) + ' MB'; };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">File Management</Typography>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setDialogOpen(true)}>Upload File</Button>
      </Box>
      <Card>
        <Box sx={{ p: 2 }}>
          <TextField size="small" select label="File Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All Types</MenuItem>
            {fileTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Box>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>File Name</TableCell><TableCell>Type</TableCell><TableCell>Patient</TableCell><TableCell>Size</TableCell><TableCell>Uploaded By</TableCell><TableCell>Date</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              : files.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No files found</TableCell></TableRow>
              : files.map(f => (
                <TableRow key={f._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{f.originalName}</TableCell>
                  <TableCell><Chip label={f.type} size="small" color={typeColors[f.type] || 'default'} /></TableCell>
                  <TableCell>{f.patient?.name || '—'}</TableCell>
                  <TableCell>{formatSize(f.size)}</TableCell>
                  <TableCell>{f.uploadedBy?.name}</TableCell>
                  <TableCell>{new Date(f.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleDownload(f)}><DownloadIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(f._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={10} rowsPerPageOptions={[10]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Button variant="outlined" component="label" fullWidth>{uploadForm.file ? uploadForm.file.name : 'Choose File'}
                <input type="file" hidden onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField select fullWidth label="File Type" value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}>
                {fileTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField select fullWidth label="Patient (Optional)" value={uploadForm.patient} onChange={(e) => setUploadForm({ ...uploadForm, patient: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {patients.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Description" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Files;
