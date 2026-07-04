import { createTheme } from '@mui/material/styles';

/**
 * Warm Manuscript visual system (audit #18).
 *
 * A trustworthy clinical look: warm paper neutrals, a deep clinical green-grey
 * primary for actions, and a single turmeric-amber accent used sparingly
 * (signature stripes, focus rings, active nav). Editorial Crimson Pro serif
 * is reserved for page titles; everything else is Atkinson Hyperlegible, which
 * is designed for low-vision / older-eye legibility.
 */

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
const SANS = '"Atkinson Hyperlegible", "Inter", "Roboto", "Segoe UI", sans-serif';

// Warm signature accent (turmeric amber). Used sparingly per the design rule:
// signature stripe, focus ring, active-nav bar, link underline — not as a fill
// for large surfaces.
const ACCENT = '#C8862A';
const ACCENT_DARK = '#E0A44A';

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#8FB3A3' : '#3D5A4C',
        light: isDark ? '#A9C8BA' : '#4F7260',
        dark: isDark ? '#6E9684' : '#2F4A3D',
        contrastText: isDark ? '#1A1612' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? ACCENT_DARK : ACCENT,
        light: isDark ? '#ECC074' : '#D9A053',
        dark: isDark ? '#B07E2C' : '#A66B20',
        contrastText: '#FFFFFF',
      },
      success: { main: isDark ? '#7FB37F' : '#4A7A4F' },
      warning: { main: isDark ? '#E0A458' : '#B26A00' },
      error: { main: isDark ? '#D9604F' : '#A23A2F' },
      background: {
        default: isDark ? '#1A1612' : '#F7F4EF',
        paper: isDark ? '#241F19' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#EDE6D8' : '#211C16',
        secondary: isDark ? '#A89E8C' : '#5C5448',
      },
      divider: isDark ? '#3A332A' : '#E5DFD3',
    },
    typography: {
      fontFamily: SANS,
      // Base font 16px so rem-based sizing is comfortable for older eyes.
      fontSize: 16,
      htmlFontSize: 16,
      body1: { fontSize: '1.125rem', lineHeight: 1.6 }, // 18px body text
      body2: { fontSize: '1rem', lineHeight: 1.5 },     // 16px secondary text
      // Editorial serif on page-level titles only (PageHeader uses h4).
      h1: { fontFamily: SERIF, fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 },
      h2: { fontFamily: SERIF, fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2 },
      h3: { fontFamily: SERIF, fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.25 },
      h4: { fontFamily: SERIF, fontWeight: 700, fontSize: '2.125rem', lineHeight: 1.2 },
      h5: { fontWeight: 600 }, // UI headings stay sans
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      overline: { letterSpacing: '0.08em', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      // Visible amber focus indicator on every interactive element (WCAG 2.4.7).
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `3px solid ${isDark ? ACCENT_DARK : ACCENT}`,
              outlineOffset: '2px',
              borderRadius: 8,
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          // Solid primary — no gradient. Cleaner and more clinical.
          contained: {
            background: isDark ? '#8FB3A3' : '#3D5A4C',
            color: isDark ? '#1A1612' : '#FFFFFF',
            '&:hover': {
              background: isDark ? '#A9C8BA' : '#2F4A3D',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          // Hairline border instead of a resting shadow — calm, paper-like.
          root: {
            borderRadius: 16,
            boxShadow: 'none',
            border: `1px solid ${isDark ? '#3A332A' : '#E5DFD3'}`,
          },
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
              backgroundColor: isDark ? '#2A241D' : '#F2EEE5',
              borderBottom: `2px solid ${isDark ? '#3A332A' : '#E5DFD3'}`,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#3A332A' : '#E5DFD3',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#A89E8C' : '#C8BFAE',
            },
          },
        },
      },
    },
  });
};
