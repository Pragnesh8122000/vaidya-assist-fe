import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// A11Y-2 fix: the page Suspense fallback gets a polite live region so
// screen-reader users hear that the new page is loading, plus a
// visual spinner. The role="status" + aria-live="polite" combination
// announces text content without interrupting whatever the user is
// currently reading.
const PageFallback = () => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: 320,
      py: 10,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      Loading page…
    </Typography>
  </Box>
);

export default PageFallback;
