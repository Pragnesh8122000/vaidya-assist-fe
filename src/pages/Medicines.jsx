import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [form, setForm] = useState({ name: '', genericName: '', stock: '', batchNumber: '', expiryDate: '', supplier: '', price: '', category: '', lowStockThreshold: '10' });

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: 10 };
      if (search) params.search = search;
      if (lowStockFilter) params.lowStock = 'true';
      const { data } = await api.get('/medicines', { params });
      setMedicines(data.data);
      setTotal(data.pagination.total);
    } catch (err) { toast.error('Failed to load medicines'); }
    setLoading(false);
  }, [page, search, lowStockFilter]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, stock: parseInt(form.stock), price: parseFloat(form.price), lowStockThreshold: parseInt(form.lowStockThreshold) || 10 };
      if (editing) {
        await api.put(`/medicines/${editing._id}`, payload);
        toast.success('Medicine updated');
      } else {
        await api.post('/medicines', payload);
        toast.success('Medicine added');
      }
      setDialogOpen(false); setEditing(null);
      setForm({ name: '', genericName: '', stock: '', batchNumber: '', expiryDate: '', supplier: '', price: '', category: '', lowStockThreshold: '10' });
      fetchMedicines();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, genericName: m.genericName || '', stock: m.stock.toString(), batchNumber: m.batchNumber || '', expiryDate: m.expiryDate?.split('T')[0] || '', supplier: m.supplier || '', price: m.price?.toString() || '', category: m.category || '', lowStockThreshold: m.lowStockThreshold?.toString() || '10' });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try { await api.delete(`/medicines/${id}`); toast.success('Medicine deleted'); fetchMedicines(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const isLowStock = (m) => m.stock <= m.lowStockThreshold;
  const isExpired = (m) => m.expiryDate && new Date(m.expiryDate) <= new Date();
  const isExpiringSoon = (m) => { if (!m.expiryDate) return false; const d = new Date(m.expiryDate); const now = new Date(); const diff = (d - now) / (1000 * 60 * 60 * 24); return diff > 0 && diff <= 30; };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Medicine Inventory</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '', genericName: '', stock: '', batchNumber: '', expiryDate: '', supplier: '', price: '', category: '', lowStockThreshold: '10' }); setDialogOpen(true); }}>
          Add Medicine
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search medicines..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} sx={{ minWidth: 250 }} />
          <Chip label="Low Stock Only" color={lowStockFilter ? 'error' : 'default'} variant={lowStockFilter ? 'filled' : 'outlined'}
            icon={<WarningIcon />} onClick={() => { setLowStockFilter(!lowStockFilter); setPage(0); }} sx={{ cursor: 'pointer' }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Medicine</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Price (₹)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : medicines.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No medicines found</TableCell></TableRow>
              ) : (
                medicines.map((m) => (
                  <TableRow key={m._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{m.name}</Typography>
                      {m.genericName && <Typography variant="caption" color="text.secondary">{m.genericName}</Typography>}
                    </TableCell>
                    <TableCell><Chip label={m.category || 'N/A'} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip label={m.stock} size="small" color={isLowStock(m) ? 'error' : 'success'} />
                    </TableCell>
                    <TableCell>{m.batchNumber}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : 'N/A'}
                        {isExpired(m) && <Chip label="Expired" size="small" color="error" sx={{ ml: 0.5 }} />}
                        {isExpiringSoon(m) && <Chip label="Soon" size="small" color="warning" sx={{ ml: 0.5 }} />}
                      </Box>
                    </TableCell>
                    <TableCell>{m.supplier}</TableCell>
                    <TableCell>₹{m.price}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(m)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(m._id)}><DeleteIcon fontSize="small" /></IconButton>
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
        <DialogTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Medicine Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Generic Name" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth type="number" label="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth label="Batch No." value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth type="date" label="Expiry Date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth type="number" label="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Grid>
            <Grid size={{ xs: 4 }}><TextField fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth type="number" label="Low Stock Threshold" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Medicines;
