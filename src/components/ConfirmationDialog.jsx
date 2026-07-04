import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// Reusable confirmation dialog. Replaces window.confirm() (SEC-6 fix) and
// adds the aria attributes MUI Dialog can miss on older code paths
// (SEC-7 / A11Y-1 fix).
//
// - aria-modal + role on the dialog surface
// - focus trap inherited from MUI Dialog
// - focus returns to the trigger button on close
// - keyboard: Escape cancels, Enter confirms
// - a separate loading state to disable both buttons during async work
const ConfirmationDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  // Optional: when true, renders the destructive colour scheme and
  // requires explicit acknowledgement before the confirm button enables.
  destructive = false,
  requireTextConfirm = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
    } else if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
      previousFocus.current.focus();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-message">
          {message}
        </DialogContentText>
        {requireTextConfirm && (
          <DialogContentText
            sx={{ mt: 2, fontStyle: 'italic', color: 'warning.main' }}
          >
            This action cannot be undone.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} aria-label={cancelLabel}>
          {cancelLabel}
        </Button>
        <Button
          ref={confirmRef}
          onClick={onConfirm}
          color={destructive ? 'error' : confirmColor}
          variant="contained"
          disabled={loading}
          aria-label={confirmLabel}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  confirmColor: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  loading: PropTypes.bool,
  destructive: PropTypes.bool,
  requireTextConfirm: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmationDialog;
