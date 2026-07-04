// Single source of truth for role identifiers. Mirrors the slugs in
// vaidya-assist-be/src/seeds/index.js so route guards, menu visibility,
// and conditional rendering all reference the same constants.

export const ROLES = Object.freeze({
  DOCTOR: 'doctor',
  ASSISTANT: 'assistant',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  PATIENT: 'patient',
});

export const ALL_STAFF_ROLES = Object.freeze([
  ROLES.DOCTOR,
  ROLES.ASSISTANT,
  ROLES.RECEPTIONIST,
  ROLES.PHARMACIST,
]);

export const ADMIN_ROUTES = Object.freeze({
  // Doctor-only — staff roster, role definitions, templates, settings.
  DOCTOR_ONLY: [ROLES.DOCTOR],
  // Doctor + assistant can see operational data (doctors list, reports).
  OPERATIONAL: [ROLES.DOCTOR, ROLES.ASSISTANT],
});

// resolveRoleSlug — accepts the populated user object from Redux and
// returns the canonical role slug string. Falls back to lowercase name
// for older user documents where `role` is not populated.
export const resolveRoleSlug = (user) => {
  if (!user) return '';
  return user.role?.slug || (user.role?.name || '').toLowerCase();
};
