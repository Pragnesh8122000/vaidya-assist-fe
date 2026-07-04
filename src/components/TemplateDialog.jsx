import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';

const emptyMedication = () => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

// Form dialog for creating or editing a prescription template. Mirrors the
// row layout used by PrescriptionDialog so the two surfaces are visually
// consistent.
const TemplateDialog = ({ open, template, onClose, onSaved }) => {
  const isEdit = Boolean(template?._id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [medications, setMedications] = useState([emptyMedication()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name || '');
      setDescription(template.description || '');
      setMedications(
        Array.isArray(template.medications) && template.medications.length > 0
          ? template.medications.map((m) => ({
              name: m.name || '',
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              duration: m.duration || '',
              instructions: m.instructions || '',
            }))
          : [emptyMedication()],
      );
    } else {
      setName('');
      setDescription('');
      setMedications([emptyMedication()]);
    }
  }, [open, template]);

  const handleMedChange = (idx, field, value) => {
    setMedications((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleAddMed = () => setMedications((prev) => [...prev, emptyMedication()]);

  const handleRemoveMed = (idx) => {
    setMedications((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required.');
      return;
    }
    const cleaned = medications
      .map((m) => ({
        name: (m.name || '').trim(),
        dosage: (m.dosage || '').trim(),
        frequency: (m.frequency || '').trim(),
        duration: (m.duration || '').trim(),
        instructions: (m.instructions || '').trim(),
      }))
      .filter((m) => m.name);
    setSaving(true);
    try {
      await onSaved({
        name: name.trim(),
        description: description.trim(),
        medications: cleaned,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6" component="span">
          {isEdit ? 'Edit template' : 'New template'}
        </Typography>
        <IconButton onClick={onClose} disabled={saving} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Template name"
              placeholder="e.g. Standard adult cold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              placeholder="Optional notes about when to use this template"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Medications</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddMed} disabled={saving}>
            Add medication
          </Button>
        </Box>

        <Stack spacing={1.5}>
          {medications.map((med, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    required
                    label="Name"
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                    disabled={saving}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Dosage"
                    placeholder="e.g. 500mg"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    disabled={saving}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Frequency"
                    placeholder="e.g. 2x daily"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                    disabled={saving}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Duration"
                    placeholder="e.g. 7 days"
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    disabled={saving}
                  />
                </Grid>
                <Grid size={{ xs: 5, sm: 1.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Notes"
                    value={med.instructions}
                    onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                    disabled={saving}
                  />
                </Grid>
                <Grid size={{ xs: 1, sm: 0.5 }} sx={{ textAlign: 'right' }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveMed(idx)}
                    disabled={saving || medications.length === 1}
                    aria-label="Remove medication"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {isEdit ? 'Save changes' : 'Create template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDialog;
