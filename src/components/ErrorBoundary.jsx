import { Component } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// A11Y-5 fix: a top-level error boundary so an uncaught exception in
// any page renders a recoverable fallback instead of a blank white
// screen. The previous behaviour was a silent crash: the user saw an
// empty <main> and the AppBar still worked, but no page ever rendered.
//
// Why a class component: React error boundaries are still the only
// API that lets a component catch errors in its children, and that
// API only works on class components. There is no hook equivalent.
//
// Fallback is reachable: 'Reload page' is a real button, not a dead
// link, and the icon + heading convey 'something went wrong' without
// blaming the user.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface the error to the console for developers. PHI risk is low
    // here because the error stack only contains component names and
    // file paths; user data lives in Redux/Redux state, not in error
    // traces. We still do not log the full component stack to any
    // remote service — that pipeline is intentionally not wired up
    // in this codebase.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          role="alert"
          aria-live="assertive"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight: 400,
            py: 8,
            px: 3,
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} aria-hidden="true" />
          <Typography variant="h5" component="h1" fontWeight={600}>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
            The page failed to load. Your work in other tabs is unaffected.
            You can try again, or reload the page to start fresh.
          </Typography>
          {this.state.error?.message && (
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: 'text.disabled', maxWidth: 600, wordBreak: 'break-word' }}
            >
              {this.state.error.message}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button variant="outlined" onClick={this.handleReset}>Try again</Button>
            <Button variant="contained" onClick={this.handleReload}>Reload page</Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
