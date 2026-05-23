import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Reports = () => {
  const [reportType, setReportType] = useState('appointments');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', gender: '', category: '', lowStock: false });

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      if (filters.gender) params.gender = filters.gender;
      if (filters.category) params.category = filters.category;
      if (filters.lowStock) params.lowStock = 'true';
      const { data: res } = await api.get(`/reports/${reportType}`, { params });
      setData(res);
    } catch (err) { toast.error('Failed to generate report'); }
    setLoading(false);
  };

  const exportReport = async (format) => {
    try {
      const params = { format };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      const response = await api.get(`/reports/${reportType}`, { params, responseType: 'blob' });
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} exported`);
    } catch (err) { toast.error('Export failed'); }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Reports</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField select fullWidth label="Report Type" value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null); }}>
                <MenuItem value="appointments">Appointments</MenuItem>
                <MenuItem value="patients">Patients</MenuItem>
                <MenuItem value="medicines">Medicines</MenuItem>
              </TextField>
            </Grid>
            {reportType === 'appointments' && (
              <>
                <Grid size={{ xs: 6, md: 2 }}><TextField fullWidth type="date" label="From" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                <Grid size={{ xs: 6, md: 2 }}><TextField fullWidth type="date" label="To" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField select fullWidth label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <MenuItem value="">All</MenuItem><MenuItem value="Waiting">Waiting</MenuItem><MenuItem value="In Consultation">In Consultation</MenuItem><MenuItem value="Completed">Completed</MenuItem><MenuItem value="Cancelled">Cancelled</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 3 }}>
              <Button variant="contained" fullWidth onClick={fetchReport} disabled={loading} sx={{ height: 56 }}>
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report ({data.total} records)</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => exportReport('pdf')} color="error">PDF</Button>
                <Button variant="outlined" size="small" startIcon={<TableChartIcon />} onClick={() => exportReport('excel')} color="success">Excel</Button>
                <Button variant="outlined" size="small" startIcon={<DescriptionIcon />} onClick={() => exportReport('csv')}>CSV</Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {reportType === 'appointments' && <><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Patient</TableCell><TableCell>Doctor</TableCell><TableCell>Status</TableCell><TableCell>Reason</TableCell></>}
                    {reportType === 'patients' && <><TableCell>Name</TableCell><TableCell>Age</TableCell><TableCell>Gender</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Blood Group</TableCell></>}
                    {reportType === 'medicines' && <><TableCell>Name</TableCell><TableCell>Stock</TableCell><TableCell>Batch</TableCell><TableCell>Expiry</TableCell><TableCell>Supplier</TableCell><TableCell>Price</TableCell></>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data?.map((item, i) => (
                    <TableRow key={i} hover>
                      {reportType === 'appointments' && <>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell><TableCell>{item.time}</TableCell><TableCell>{item.patient?.name}</TableCell><TableCell>{item.doctor?.name}</TableCell>
                        <TableCell><Chip label={item.status} size="small" color={item.status === 'Completed' ? 'success' : item.status === 'Cancelled' ? 'error' : 'default'} /></TableCell><TableCell>{item.reason}</TableCell>
                      </>}
                      {reportType === 'patients' && <><TableCell>{item.name}</TableCell><TableCell>{item.age}</TableCell><TableCell>{item.gender}</TableCell><TableCell>{item.phone}</TableCell><TableCell>{item.email}</TableCell><TableCell>{item.bloodGroup}</TableCell></>}
                      {reportType === 'medicines' && <><TableCell>{item.name}</TableCell><TableCell>{item.stock}</TableCell><TableCell>{item.batchNumber}</TableCell><TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : ''}</TableCell><TableCell>{item.supplier}</TableCell><TableCell>₹{item.price}</TableCell></>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
export default Reports;
