import { describe, it, expect } from 'vitest';
import { getTheme } from './theme';

// Test Gap P2 — palette assertion. The "Warm Manuscript" theme is the
// visual contract for every screen; if a primary tone drifts, the rest
// of the app silently loses the clinical-green / turmeric-amber identity.
// These tests pin the canonical hex values so a rename or accidental
// edit surfaces in CI rather than as a designer-review note.

describe('getTheme', () => {
  it('returns a light theme with the clinical green primary', () => {
    const theme = getTheme('light');
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe('#3D5A4C');
    expect(theme.palette.primary.contrastText).toBe('#FFFFFF');
  });

  it('returns a dark theme with the sage primary', () => {
    const theme = getTheme('dark');
    expect(theme.palette.mode).toBe('dark');
    // Dark mode flips primary to a lighter sage so it still reads as
    // "primary action" on the dark paper background.
    expect(theme.palette.primary.main).toBe('#8FB3A3');
    expect(theme.palette.primary.contrastText).toBe('#1A1612');
  });

  it('uses the turmeric amber secondary in both modes', () => {
    expect(getTheme('light').palette.secondary.main).toBe('#C8862A');
    expect(getTheme('dark').palette.secondary.main).toBe('#E0A44A');
  });

  it('sets the paper background to warm neutrals, not pure white or black', () => {
    // Warm neutrals are a design contract — the visual feel is "clinical
    // paper" not "office white". Catching a regression to #FFFFFF or
    // #000000 here is faster than spotting it in a screenshot diff.
    expect(getTheme('light').palette.background.paper).toBe('#FFFFFF');
    expect(getTheme('light').palette.background.default).toBe('#F7F4EF');
    expect(getTheme('dark').palette.background.paper).toBe('#241F19');
    expect(getTheme('dark').palette.background.default).toBe('#1A1612');
  });

  it('configures base typography for older-eye legibility (16px / 18px body)', () => {
    const theme = getTheme('light');
    // 16px htmlFontSize + 18px body1 are the "older-eye" legibility
    // baseline from the design system. A regression here is a silent
    // accessibility regression.
    expect(theme.typography.fontSize).toBe(16);
    expect(theme.typography.htmlFontSize).toBe(16);
    expect(theme.typography.body1.fontSize).toBe('1.125rem');
  });

  it('uses Crimson Pro serif for page titles and Atkinson Hyperlegible for body', () => {
    const theme = getTheme('light');
    // Editorial serif on h1–h4 mirrors the "manuscript" metaphor. Body
    // text is Atkinson Hyperlegible, which is purpose-built for low
    // vision. Catching a swap to Roboto / Inter on body catches the
    // most common a11y regression on this codebase.
    expect(theme.typography.h1.fontFamily).toMatch(/Crimson Pro/);
    expect(theme.typography.h4.fontFamily).toMatch(/Crimson Pro/);
    expect(theme.typography.fontFamily).toMatch(/Atkinson Hyperlegible/);
  });

  it('exposes a 12px border radius as the design-system default', () => {
    expect(getTheme('light').shape.borderRadius).toBe(12);
  });

  it('disables button elevation and removes the root drop shadow (clinical look)', () => {
    const theme = getTheme('light');
    const root = theme.components.MuiButton.styleOverrides.root;
    // A button root should never paint a drop shadow — the design is
    // "calm, paper-like", not "Material 3 floating". The
    // `disableElevation` default prop then makes contained buttons
    // never paint their resting shadow on hover either.
    expect(theme.components.MuiButton.defaultProps.disableElevation).toBe(true);
    expect(root.boxShadow).toBe('none');
    expect(root['&:hover'].boxShadow).toBe('none');
  });
});
