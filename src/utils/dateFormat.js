// UX-9: shared date/time helpers. Replaces the bare toLocaleDateString()
// calls and the copy-pasted getUTCFullYear/Month/Date reassembly that
// was duplicated across Appointments, Medicines, DoctorDashboard and
// Reports. Standardising here means a single timezone-explicit format
// across the staff UI and one place to fix date-rendering bugs.
//
// All formatters use explicit en-IN options so output does NOT vary by
// the viewer's OS locale (the previous bare toLocaleDateString() did).

const DATE_OPTIONS = { year: 'numeric', month: 'short', day: 'numeric' };
const LONG_DATE_OPTIONS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

// Format a Date (or date-ish string) as e.g. "5 Jul 2026". Returns ''
// for null/undefined so callers can render N/A without a guard.
export const formatDate = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', DATE_OPTIONS);
};

// Long form for headers, e.g. "Sunday, 5 July 2026".
export const formatLongDate = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', LONG_DATE_OPTIONS);
};

// Convert a Date stored at UTC midnight into a YYYY-MM-DD string built
// from its UTC components — preserves the original calendar day in
// every timezone. Used by date inputs when editing an existing record.
export const toUTCDateInput = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

// Today's date in the user's local timezone as YYYY-MM-DD — used for
// "is this appointment today?" comparisons and date filter defaults.
export const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Compare an appointment date (stored at UTC midnight) against today's
// local YYYY-MM-DD. Returns false for missing/invalid dates.
export const isUTCDateToday = (value) => {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return toUTCDateInput(d) === todayLocalISO();
};