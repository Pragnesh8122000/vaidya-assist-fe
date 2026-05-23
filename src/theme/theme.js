import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1565C0',
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00897B',
      light: '#4DB6AC',
      dark: '#00695C',
    },
    success: { main: '#2E7D32' },
    warning: { main: '#F57F17' },
    error: { main: '#C62828' },
    background: {
      default: mode === 'dark' ? '#0A1929' : '#F5F7FA',
      paper: mode === 'dark' ? '#1A2332' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#E3E8EF' : '#1A2027',
      secondary: mode === 'dark' ? '#99AAB5' : '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px', boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(21,101,192,0.25)' } },
        contained: { background: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)', border: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            backgroundColor: mode === 'dark' ? '#0D1520' : '#F0F4F8',
            borderBottom: mode === 'dark' ? '2px solid #1E3A5F' : '2px solid #E3E8EF',
          }
        }
      }
    },
  },
});
