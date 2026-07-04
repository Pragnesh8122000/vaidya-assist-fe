import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';
import { toast } from 'react-toastify';
import api from '../api/axios';

const emptyMedication = () => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

// Composer Dialog. Lets the doctor attach a structured prescription to a
// completed appointment, optionally seeded from a saved template. Mirrors the
// patient-queue kanban in DoctorDashboard.jsx.
const PrescriptionDialog = ({ open, appointment, onClose, onSaved }) => {
  const [medications, setMedications] = useState([emptyMedication()]);
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const existing = appointment?.prescription;

  // Initialise from any existing prescription; reset whenever we open against
  // a different appointment.
  useEffect(() => {
    if (!open || !appointment) return;
    if (existing && Array.isArray(existing.medications) && existing.medications.length > 0) {
      setMedications(
        existing.medications.map((m) => ({
          name: m.name || '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          duration: m.duration || '',
          instructions: m.instructions || '',
        }))
      );
      setNotes(existing.notes || '');
    } else {
      setMedications([emptyMedication()]);
      setNotes('');
    }
    setSelectedTemplateId('');
  }, [open, appointment, existing]);

  const loadTemplates = useCallback(async () => {
    if (!open) return;
    setLoadingTemplates(true);
    try {
      const { data } = await api.get('/prescription-templates');
      setTemplates(Array.isArray(data?.data) ? data.data : []);
    } catch {
      // Templates are an accelerator, not a hard dependency — keep silent.
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) loadTemplates();
  }, [open, loadTemplates]);

  // Fetch the medicine catalogue once on open so the per-row name picker can
  // suggest existing entries. freeSolo still allows typing brand-new values.
  const loadMedicines = useCallback(async () => {
    if (!open) return;
    try {
      const { data } = await api.get('/medicines?limit=200');
      setMedicines(Array.isArray(data?.data) ? data.data : []);
    } catch {
      // Catalogue is an accelerator; silent fallback to free-text entry.
      setMedicines([]);
    }
  }, [open]);

  useEffect(() => {
    if (open) loadMedicines();
  }, [open, loadMedicines]);

  const handleMedChange = (idx, field, value) => {
    setMedications((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleAddMed = () => setMedications((prev) => [...prev, emptyMedication()]);

  const handleRemoveMed = (idx) => {
    setMedications((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const applyTemplate = () => {
    const tpl = templates.find((t) => t._id === selectedTemplateId);
    if (!tpl) {
      toast.error('Pick a template first.');
      return;
    }
    if (!Array.isArray(tpl.medications) || tpl.medications.length === 0) {
      toast.error('That template has no medications.');
      return;
    }
    setMedications(
      tpl.medications.map((m) => ({
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        instructions: m.instructions || '',
      }))
    );
    if (tpl.description && !notes) setNotes(tpl.description);
    toast.success(`Loaded template: ${tpl.name}`);
  };

  const handleSave = async () => {
    if (!appointment?._id) return;
    const cleaned = medications
      .map((m) => ({
        name: (m.name || '').trim(),
        dosage: (m.dosage || '').trim(),
        frequency: (m.frequency || '').trim(),
        duration: (m.duration || '').trim(),
        instructions: (m.instructions || '').trim(),
      }))
      .filter((m) => m.name);
    if (cleaned.length === 0) {
      toast.error('Add at least one medication with a name.');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/appointments/${appointment._id}/prescription`, {
        medications: cleaned,
        notes: notes.trim(),
      });
      toast.success(existing ? 'Prescription updated' : 'Prescription saved');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const patientName = appointment?.patient?.name || 'Patient';
  const aptDate = appointment?.date ? new Date(appointment.date).toLocaleDateString() : '';
  const aptTime = appointment?.time || '';
  const reason = appointment?.reason || '';

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicationIcon color="primary" />
          <Typography variant="h6" component="span">
            {existing ? 'Edit prescription' : 'Write prescription'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={saving} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderLeft: '4px solid',
            borderColor: 'secondary.main',
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>{patientName}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {aptDate && <Chip label={aptDate} size="small" variant="outlined" />}
            {aptTime && <Chip label={aptTime} size="small" variant="outlined" />}
            {reason && <Chip label={reason} size="small" variant="outlined" />}
          </Stack>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Load from template (optional)</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
              select
              size="small"
              fullWidth
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={loadingTemplates}
              label={loadingTemplates ? 'Loading templates…' : 'Template'}
            >
              <MenuItem value="">— None —</MenuItem>
              {templates.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name} {Array.isArray(t.medications) ? `(${t.medications.length} meds)` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              onClick={applyTemplate}
              disabled={!selectedTemplateId || saving}
              sx={{ minWidth: 140 }}
            >
              Use template
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

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
                  <Autocomplete
                    size="small"
                    fullWidth
                    freeSolo
                    options={medicines}
                    getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
                    isOptionEqualToValue={(opt, val) => opt?.name === (typeof val === 'string' ? val : val?.name)}
                    value={med.name}
                    onChange={(_, val) => handleMedChange(idx, 'name', typeof val === 'string' ? val : val?.name || '')}
                    onInputChange={(_, val) => handleMedChange(idx, 'name', val)}
                    disabled={saving}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Name"
                        placeholder="Select or type medicine"
                      />
                    )}
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

        {medications.length === 0 && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Button startIcon={<AddIcon />} onClick={handleAddMed} disabled={saving}>
              Add medication
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            placeholder="Additional advice, follow-up instructions, warnings…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : (existing ? 'Update prescription' : 'Save prescription')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionDialog;
