import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const baseProps = {
    open: true,
    title: 'Delete patient',
    message: 'This cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders the title and message when open', () => {
    render(<ConfirmationDialog {...baseProps} />);
    expect(screen.getByText('Delete patient')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<ConfirmationDialog {...baseProps} open={false} />);
    expect(screen.queryByText('Delete patient')).toBeNull();
  });

  it('uses an aria-labelledby / aria-describedby pair for screen readers', () => {
    render(<ConfirmationDialog {...baseProps} />);
    // The title and message elements get the IDs the Dialog surfaces via
    // aria-labelledby/aria-describedby. Verify they exist by id.
    expect(document.getElementById('confirmation-dialog-title')).toBeInTheDocument();
    expect(document.getElementById('confirmation-dialog-message')).toBeInTheDocument();
  });

  it('fires onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmationDialog {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmationDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while loading so a double-click cannot fire twice', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmationDialog {...baseProps} loading onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('uses the error colour scheme for destructive actions', () => {
    render(<ConfirmationDialog {...baseProps} destructive confirmLabel="Delete" />);
    const confirmBtn = screen.getByRole('button', { name: /delete/i });
    expect(confirmBtn.className).toMatch(/MuiButton-colorError/);
  });
});
