// TS-4 fix: shared form shapes for the 5 most-edited pages. Each
// page's `useState<FormShape>` declaration imports from here so a
// field rename surfaces here first, not as silent undefined access
// at submit time. The optional-where-empty fields use `string` with
// `''` defaults so a single `setForm({ ...form, name: 'X' })`
// pattern works without per-field type casts.

/**
 * @typedef {Object} PatientForm
 * @property {string} name
 * @property {string|number} age          empty string when unset
 * @property {''|'Male'|'Female'|'Other'} gender
 * @property {string} phone
 * @property {string} email
 * @property {string} address
 * @property {string} bloodGroup
 */

/** @type {PatientForm} */
export const EMPTY_PATIENT_FORM = Object.freeze({
  name: '',
  age: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  bloodGroup: '',
});

/**
 * @typedef {Object} AppointmentForm
 * @property {string} patient             _id of the selected patient
 * @property {string} date                YYYY-MM-DD
 * @property {string} time                HH:mm
 * @property {'Waiting'|'Confirmed'|'In Consultation'|'Completed'|'Cancelled'} status
 * @property {string} reason
 * @property {string} notes
 */

/** @type {AppointmentForm} */
export const EMPTY_APPOINTMENT_FORM = Object.freeze({
  patient: '',
  date: '',
  time: '',
  status: 'Waiting',
  reason: '',
  notes: '',
});

/**
 * @typedef {Object} MedicineForm
 * @property {string} name
 * @property {string} genericName
 * @property {string|number} stock         empty string when unset
 * @property {string} batchNumber
 * @property {string} expiryDate           YYYY-MM-DD
 * @property {string} supplier
 * @property {string|number} price         empty string when unset
 * @property {string} category
 * @property {string|number} lowStockThreshold
 */

/** @type {MedicineForm} */
export const EMPTY_MEDICINE_FORM = Object.freeze({
  name: '',
  genericName: '',
  stock: '',
  batchNumber: '',
  expiryDate: '',
  supplier: '',
  price: '',
  category: '',
  lowStockThreshold: '10',
});

/**
 * @typedef {Object} UserForm
 * @property {string} name
 * @property {string} email                required on create, ignored on update
 * @property {string} password             required on create, ignored on update
 * @property {string} phone
 * @property {string} role                 _id of the assigned role
 */

/** @type {UserForm} */
export const EMPTY_USER_FORM = Object.freeze({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: '',
});

/**
 * @typedef {Object} RoleForm
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string[]} permissions        array of permission _ids
 */

/** @type {RoleForm} */
export const EMPTY_ROLE_FORM = Object.freeze({
  name: '',
  slug: '',
  description: '',
  permissions: [],
});
