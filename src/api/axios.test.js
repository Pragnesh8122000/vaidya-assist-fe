import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api, { setActiveClinicId, getActiveClinicId } from './axios';

vi.mock('axios', () => {
  // We need the create() interceptor pipeline to actually run so we
  // can observe what the request interceptor does to a real call.
  const handlers = { request: [], response: [] };
  const instance = {
    interceptors: {
      request: { use: (ok, err) => { handlers.request.push({ ok, err }); } },
      response: { use: (ok, err) => { handlers.response.push({ ok, err }); } },
    },
    __handlers: handlers,
  };
  return {
    default: { create: () => instance },
    __esModule: true,
  };
});

// Re-import the mocked axios so the test can talk to the same instance
// the production code does.
const axiosMock = await import('axios');
const ax = axiosMock.default.create();

describe('axios clinic scope interceptor (ARCH-3)', () => {
  beforeEach(() => { setActiveClinicId(null); });
  afterEach(() => { setActiveClinicId(null); });

  it('attaches the bearer token from localStorage on every request', () => {
    localStorage.setItem('token', 'bearer-abc');
    const handler = ax.__handlers.request[0].ok;
    const config = { headers: {}, url: '/patients' };
    const out = handler(config);
    expect(out.headers.Authorization).toBe('Bearer bearer-abc');
  });

  it('injects clinicId as a query param when a clinic is active', () => {
    setActiveClinicId('clinic-42');
    const handler = ax.__handlers.request[0].ok;
    const out = handler({ headers: {}, url: '/patients' });
    expect(out.params.clinicId).toBe('clinic-42');
  });

  it('does NOT inject clinicId on /auth/* routes (login must stay unscoped)', () => {
    setActiveClinicId('clinic-42');
    const handler = ax.__handlers.request[0].ok;
    const out = handler({ headers: {}, url: '/auth/login' });
    expect(out.params?.clinicId).toBeUndefined();
  });

  it('does NOT inject clinicId when no active clinic is set', () => {
    setActiveClinicId(null);
    const handler = ax.__handlers.request[0].ok;
    const out = handler({ headers: {}, url: '/patients' });
    expect(out.params?.clinicId).toBeUndefined();
  });

  it('preserves caller-supplied params when injecting clinicId', () => {
    setActiveClinicId('clinic-7');
    const handler = ax.__handlers.request[0].ok;
    const out = handler({ headers: {}, url: '/patients', params: { page: 2 } });
    expect(out.params.clinicId).toBe('clinic-7');
    expect(out.params.page).toBe(2);
  });

  it('getActiveClinicId reflects the current scope', () => {
    setActiveClinicId('clinic-1');
    expect(getActiveClinicId()).toBe('clinic-1');
    setActiveClinicId(null);
    expect(getActiveClinicId()).toBeNull();
  });

  it('does not attach Authorization when no token is in storage', () => {
    localStorage.removeItem('token');
    const handler = ax.__handlers.request[0].ok;
    const out = handler({ headers: {}, url: '/patients' });
    expect(out.headers.Authorization).toBeUndefined();
  });
});
