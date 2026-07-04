// TS-2 / TS-3 fix: shared response shapes for the most-consumed backend
// endpoints. Pages import these for their state, action payloads, and
// prop types — when the backend changes a field, the error surfaces
// here first instead of as a silent runtime undefined access.

/**
 * The standard axios response envelope used by the API. `data` carries
 * the resource (or array of resources); `pagination` is present on
 * list endpoints; `unreadCount` is the notification-specific extra.
 *
 * @template T
 * @typedef {Object} ApiEnvelope
 * @property {boolean} success
 * @property {T} data
 * @property {string} [message]
 * @property {{page: number, limit: number, total: number, totalPages: number}} [pagination]
 * @property {number} [unreadCount]
 */

/**
 * @typedef {Object} Patient
 * @property {string} _id
 * @property {string} name
 * @property {number} [age]
 * @property {'Male'|'Female'|'Other'} [gender]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} [bloodGroup]
 * @property {string} [displayId]
 * @property {string} clinicId
 */

/**
 * @typedef {Object} Appointment
 * @property {string} _id
 * @property {string} displayId
 * @property {string} date
 * @property {string} time
 * @property {'Waiting'|'Confirmed'|'In Consultation'|'Completed'|'Cancelled'} status
 * @property {string} [reason]
 * @property {string} [notes]
 * @property {{_id: string, name: string}} [patient]
 * @property {{_id: string, name: string}} [doctor]
 * @property {string} clinicId
 */

/**
 * @typedef {Object} Medicine
 * @property {string} _id
 * @property {string} name
 * @property {string} [genericName]
 * @property {number} stock
 * @property {number} lowStockThreshold
 * @property {string} [batchNumber]
 * @property {string} [expiryDate]
 * @property {string} [supplier]
 * @property {number} [price]
 * @property {string} [category]
 * @property {string} clinicId
 */

/**
 * @typedef {Object} Notification
 * @property {string} _id
 * @property {string} title
 * @property {string} message
 * @property {boolean} read
 * @property {string} [type]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalPatients
 * @property {number} todayAppointments
 * @property {number} pendingAppointments
 * @property {number} totalMedicines
 * @property {number} lowStockMedicines
 */

export {}; // JSDoc-only module
