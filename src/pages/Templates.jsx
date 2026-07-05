import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-toastify';
import api from '../api/axios';
import TemplateDialog from '../components/TemplateDialog';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { formatDate } from '../utils/dateFormat';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/prescription-templates');
      setTemplates(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tpl) => {
    setEditing(tpl);
    setDialogOpen(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editing?._id) {
        await api.put(`/prescription-templates/${editing._id}`, payload);
        toast.success('Template updated');
      } else {
        await api.post('/prescription-templates', payload);
        toast.success('Template created');
      }
      setDialogOpen(false);
      setEditing(null);
      await loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/prescription-templates/${confirmDelete._id}`);
      toast.success('Template deleted');
      setConfirmDelete(null);
      await loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" gutterBottom>Prescription Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Reusable medication sets you can apply when writing a prescription.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          New Template
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No templates yet. Create one to speed up your prescriptions.
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                New Template
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Medications</TableCell>
                    <TableCell>Created by</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {t.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{t.medications?.length || 0}</TableCell>
                      <TableCell>{t.createdBy?.name || '—'}</TableCell>
                      <TableCell>
                        {t.createdAt ? formatDate(t.createdAt) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenEdit(t)} aria-label="Edit template">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => setConfirmDelete(t)}
                            aria-label="Delete template"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <TemplateDialog
        open={dialogOpen}
        template={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(confirmDelete)}
        title="Delete template?"
        message={confirmDelete ? `"${confirmDelete.name}" will be permanently removed. This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </Box>
  );
};

export default Templates;
