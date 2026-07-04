import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const Boom = () => { throw new Error('Test failure'); };
const Quiet = () => <div>everything is fine</div>;

describe('ErrorBoundary', () => {
  // Silence React's "uncaught error" log for the duration of these tests
  // — without this, every render of <Boom /> produces a console.error
  // that pollutes the test output.
  vi.spyOn(console, 'error').mockImplementation(() => {});

  it('renders children when no error is thrown', () => {
    render(<ErrorBoundary><Quiet /></ErrorBoundary>);
    expect(screen.getByText('everything is fine')).toBeInTheDocument();
  });

  it('renders the fallback when a child throws', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText('Test failure')).toBeInTheDocument();
  });

  it('offers a Reload button so the user can recover', () => {
    const reload = vi.fn();
    const orig = window.location;
    delete window.location;
    window.location = { ...orig, reload };
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    expect(reload).toHaveBeenCalled();
    window.location = orig;
  });

  it('Try again clears the error state and re-renders children', () => {
    // A child that conditionally throws so we can verify the reset path.
    const Conditional = ({ shouldThrow }) => shouldThrow ? <Boom /> : <Quiet />;
    const { rerender } = render(<ErrorBoundary><Conditional shouldThrow /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Reset by swapping children first, then clicking Try again.
    rerender(<ErrorBoundary><Conditional shouldThrow={false} /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('everything is fine')).toBeInTheDocument();
  });

  it('uses role="alert" and aria-live="assertive" so screen readers announce the error', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
