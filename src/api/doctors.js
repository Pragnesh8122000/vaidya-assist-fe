import api from './axios';

/**
 * Fetch the list of doctors for the authenticated clinic.
 *
 * Uses the shared /api/doctors endpoint so the inventory/dashboard app
 * and the patient appointment app see the same doctor data.
 *
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @param {string} [params.search]
 * @returns {Promise<{success: boolean, data: any[], count: number, pagination?: object}>}
 */
export async function getDoctors({ page = 1, limit = 50, search = '' } = {}) {
  const { data } = await api.get('/doctors', {
    params: { page, limit, search },
  });
  return data;
}
