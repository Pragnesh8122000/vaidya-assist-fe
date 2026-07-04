import { describe, it, expect } from 'vitest';
import { ROLES, ALL_STAFF_ROLES, ADMIN_ROUTES, resolveRoleSlug } from './auth';

describe('ROLES constants', () => {
  it('exposes the canonical role slugs the backend seeds', () => {
    expect(ROLES.DOCTOR).toBe('doctor');
    expect(ROLES.ASSISTANT).toBe('assistant');
    expect(ROLES.RECEPTIONIST).toBe('receptionist');
    expect(ROLES.PHARMACIST).toBe('pharmacist');
    expect(ROLES.PATIENT).toBe('patient');
  });

  it('is frozen so a misbehaving caller cannot add ad-hoc roles', () => {
    expect(Object.isFrozen(ROLES)).toBe(true);
  });
});

describe('ALL_STAFF_ROLES', () => {
  it('contains exactly the four back-office roles (excludes patient)', () => {
    expect(ALL_STAFF_ROLES).toEqual(['doctor', 'assistant', 'receptionist', 'pharmacist']);
    expect(ALL_STAFF_ROLES).not.toContain('patient');
  });
});

describe('ADMIN_ROUTES', () => {
  it('DOCTOR_ONLY is just doctor', () => {
    expect(ADMIN_ROUTES.DOCTOR_ONLY).toEqual(['doctor']);
  });
  it('OPERATIONAL includes doctor and assistant', () => {
    expect(ADMIN_ROUTES.OPERATIONAL).toEqual(['doctor', 'assistant']);
  });
});

describe('resolveRoleSlug', () => {
  it('returns the role.slug when present', () => {
    expect(resolveRoleSlug({ role: { slug: 'doctor', name: 'Doctor' } })).toBe('doctor');
  });
  it('falls back to lowercased role.name when slug is missing', () => {
    expect(resolveRoleSlug({ role: { name: 'Assistant' } })).toBe('assistant');
  });
  it('returns empty string for a null user (route guard branch)', () => {
    expect(resolveRoleSlug(null)).toBe('');
    expect(resolveRoleSlug(undefined)).toBe('');
  });
  it('returns empty string for a user with no role at all', () => {
    expect(resolveRoleSlug({})).toBe('');
  });
});
