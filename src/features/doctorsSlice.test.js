import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import doctorsReducer, {
  getDoctors,
  setDoctorsSearch,
  clearDoctorsError,
} from './doctorsSlice';

vi.mock('../api/doctors', () => ({
  getDoctors: vi.fn(),
}));

const makeStore = (preloaded) => configureStore({
  reducer: { doctors: doctorsReducer },
  preloadedState: preloaded,
});

describe('doctorsSlice', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('initializes with empty doctors, no search and idle state', () => {
    const store = makeStore();
    expect(store.getState().doctors.data).toEqual([]);
    expect(store.getState().doctors.count).toBe(0);
    expect(store.getState().doctors.loading).toBe(false);
    expect(store.getState().doctors.error).toBeNull();
    expect(store.getState().doctors.search).toBe('');
  });

  it('setDoctorsSearch updates the search term', () => {
    const store = makeStore();
    store.dispatch(setDoctorsSearch('Sharma'));
    expect(store.getState().doctors.search).toBe('Sharma');
  });

  it('clearDoctorsError removes the error only', () => {
    const store = makeStore({
      doctors: {
        data: [{ _id: '1', name: 'Dr. A' }],
        count: 1,
        loading: false,
        error: 'network error',
        search: 'A',
      },
    });
    store.dispatch(clearDoctorsError());
    expect(store.getState().doctors.error).toBeNull();
    expect(store.getState().doctors.data).toHaveLength(1);
    expect(store.getState().doctors.search).toBe('A');
  });

  it('fulfilled loads doctors and count', async () => {
    const { getDoctors: fetchDoctorsApi } = await import('../api/doctors');
    fetchDoctorsApi.mockResolvedValueOnce({
      data: [{ _id: 'd1', name: 'Dr. Rajesh Sharma' }],
      count: 1,
    });
    const store = makeStore({ doctors: { ...makeStore().getState().doctors, search: 'Raj' } });
    await store.dispatch(getDoctors({ search: 'Raj' }));
    expect(store.getState().doctors.loading).toBe(false);
    expect(store.getState().doctors.error).toBeNull();
    expect(store.getState().doctors.data).toEqual([{ _id: 'd1', name: 'Dr. Rajesh Sharma' }]);
    expect(store.getState().doctors.count).toBe(1);
    expect(fetchDoctorsApi).toHaveBeenCalledWith({ search: 'Raj', page: 1, limit: 50 });
  });

  it('pending sets loading and clears error', async () => {
    const { getDoctors: fetchDoctorsApi } = await import('../api/doctors');
    fetchDoctorsApi.mockImplementationOnce(() => new Promise(() => {}));
    const store = makeStore({ doctors: { ...makeStore().getState().doctors, error: 'old error' } });
    store.dispatch(getDoctors({}));
    expect(store.getState().doctors.loading).toBe(true);
    expect(store.getState().doctors.error).toBeNull();
  });

  it('rejected surfaces the API message as error', async () => {
    const { getDoctors: fetchDoctorsApi } = await import('../api/doctors');
    fetchDoctorsApi.mockRejectedValueOnce({ response: { data: { message: 'Clinic required' } } });
    const store = makeStore();
    await store.dispatch(getDoctors({}));
    expect(store.getState().doctors.loading).toBe(false);
    expect(store.getState().doctors.error).toBe('Clinic required');
    expect(store.getState().doctors.data).toEqual([]);
  });

  it('rejected falls back to a default error when the API has no message', async () => {
    const { getDoctors: fetchDoctorsApi } = await import('../api/doctors');
    fetchDoctorsApi.mockRejectedValueOnce(new Error('timeout'));
    const store = makeStore();
    await store.dispatch(getDoctors({}));
    expect(store.getState().doctors.loading).toBe(false);
    expect(store.getState().doctors.error).toBe('Failed to load doctors');
  });
});
