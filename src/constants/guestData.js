/**
 * Guest-mode constants — all dummy data lives here.
 * No backend calls are made when isGuest is true.
 *
 * Mirrors the pattern in vaidya-assist-appointment/src/constants/guestData.ts
 * but adapted for the doctor/staff portal (different data shape, different
 * restricted routes).
 */

export const GUEST_USER = {
  _id: 'guest-doctor-001',
  name: 'Dr. Guest',
  email: 'guest@vaidya.com',
  phone: '+91-00000-00000',
  role: { _id: 'role-doctor', name: 'Doctor', slug: 'doctor' },
  clinicId: 'clinic-local-001',
};

export const GUEST_DOCTORS = [
  {
    _id: 'guest-doc-1',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh@vaidya.com',
    phone: '+91-98765-43210',
    role: { _id: 'role-doctor', name: 'Doctor', slug: 'doctor' },
    specialization: 'General Physician',
    available: true,
  },
  {
    _id: 'guest-doc-2',
    name: 'Dr. Priya Patel',
    email: 'priya@vaidya.com',
    phone: '+91-98765-43211',
    role: { _id: 'role-doctor', name: 'Doctor', slug: 'doctor' },
    specialization: 'Dermatologist',
    available: true,
  },
  {
    _id: 'guest-doc-3',
    name: 'Dr. Vikram Singh',
    email: 'vikram@vaidya.com',
    phone: '+91-98765-43212',
    role: { _id: 'role-doctor', name: 'Doctor', slug: 'doctor' },
    specialization: 'Cardiologist',
    available: false,
  },
  {
    _id: 'guest-doc-4',
    name: 'Dr. Anita Desai',
    email: 'anita@vaidya.com',
    phone: '+91-98765-43213',
    role: { _id: 'role-doctor', name: 'Doctor', slug: 'doctor' },
    specialization: 'Pediatrician',
    available: true,
  },
];

export const GUEST_APPOINTMENTS = [
  {
    _id: 'guest-apt-1',
    patient: { _id: 'guest-pt-1', name: 'Arun Kumar', phone: '+91-91111-11111' },
    doctor: { _id: 'guest-doc-1', name: 'Dr. Rajesh Sharma' },
    date: '2026-07-15',
    time: '10:30',
    reason: 'Routine checkup',
    status: 'Waiting',
  },
  {
    _id: 'guest-apt-2',
    patient: { _id: 'guest-pt-2', name: 'Sneha Reddy', phone: '+91-92222-22222' },
    doctor: { _id: 'guest-doc-2', name: 'Dr. Priya Patel' },
    date: '2026-07-15',
    time: '11:00',
    reason: 'Skin rash',
    status: 'Waiting',
  },
  {
    _id: 'guest-apt-3',
    patient: { _id: 'guest-pt-3', name: 'Mohan Das', phone: '+91-93333-33333' },
    doctor: { _id: 'guest-doc-1', name: 'Dr. Rajesh Sharma' },
    date: '2026-07-14',
    time: '14:00',
    reason: 'Follow-up consultation',
    status: 'Completed',
  },
  {
    _id: 'guest-apt-4',
    patient: { _id: 'guest-pt-4', name: 'Kavitha Iyer', phone: '+91-94444-44444' },
    doctor: { _id: 'guest-doc-3', name: 'Dr. Vikram Singh' },
    date: '2026-07-13',
    time: '09:00',
    reason: 'Chest pain evaluation',
    status: 'Completed',
  },
];

export const GUEST_DASHBOARD_STATS = {
  totalPatients: 156,
  todayAppointments: 12,
  pendingAppointments: 5,
  completedAppointments: 7,
  totalDoctors: 4,
  revenue: 24500,
  appointmentChart: [
    { date: 'Jul 9', count: 8 },
    { date: 'Jul 10', count: 12 },
    { date: 'Jul 11', count: 10 },
    { date: 'Jul 12', count: 15 },
    { date: 'Jul 13', count: 9 },
    { date: 'Jul 14', count: 11 },
    { date: 'Jul 15', count: 12 },
  ],
  statusDist: [
    { name: 'Completed', value: 45, color: '#4caf50' },
    { name: 'Waiting', value: 20, color: '#ff9800' },
    { name: 'Cancelled', value: 8, color: '#f44336' },
  ],
};

export const GUEST_MEDICINES = [
  {
    _id: 'guest-med-1',
    name: 'Paracetamol 500mg',
    category: 'Analgesic',
    stock: 250,
    price: 25,
    manufacturer: 'Demo Pharma',
    expiryDate: '2027-06',
  },
  {
    _id: 'guest-med-2',
    name: 'Amoxicillin 250mg',
    category: 'Antibiotic',
    stock: 120,
    price: 45,
    manufacturer: 'Demo Labs',
    expiryDate: '2027-03',
  },
  {
    _id: 'guest-med-3',
    name: 'Omeprazole 20mg',
    category: 'Antacid',
    stock: 80,
    price: 35,
    manufacturer: 'Demo Pharma',
    expiryDate: '2027-09',
  },
  {
    _id: 'guest-med-4',
    name: 'Cetirizine 10mg',
    category: 'Antihistamine',
    stock: 200,
    price: 15,
    manufacturer: 'Demo Labs',
    expiryDate: '2027-12',
  },
];

/**
 * Routes that guest users cannot access at all.
 * They'll see a restriction overlay and a prompt to create an account.
 */
export const GUEST_RESTRICTED_ROUTES = [
  '/patients',
  '/medicines/add',
  '/agent',
  '/assistants',
  '/roles',
  '/settings',
];

/**
 * Actions that guest users cannot perform (even on visible pages).
 * These are checked at the component level — e.g. "Add Appointment" button.
 */
export const GUEST_RESTRICTED_ACTIONS = [
  'create-appointment',
  'edit-appointment',
  'cancel-appointment',
  'add-doctor',
  'edit-doctor',
  'delete-doctor',
  'add-medicine',
  'delete-medicine',
];

export const GUEST_RESTRICTION_MESSAGES = {
  '/patients': {
    title: 'Patient Records Require an Account',
    body: "You're exploring in demo mode. To access patient records, please create an account or sign in.",
  },
  '/agent': {
    title: 'AI Assistant Requires an Account',
    body: "The AI assistant is available to registered staff. Please create an account to use this feature.",
  },
  '/assistants': {
    title: 'Assistant Management Requires an Account',
    body: "Managing assistants is available to registered doctors only. Please sign in to access this feature.",
  },
  '/roles': {
    title: 'Role Management Requires an Account',
    body: "Role management is available to registered doctors only. Please sign in to access this feature.",
  },
  '/settings': {
    title: 'Settings Require an Account',
    body: "You're exploring in demo mode. To manage clinic settings, please create an account or sign in.",
  },
  default: {
    title: 'This Feature Requires an Account',
    body: "You're currently exploring in demo mode. To access this feature, please create an account or sign in.",
  },
};