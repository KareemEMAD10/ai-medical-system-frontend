// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  PATIENTS: {
    BASE: '/patients',
    MEDICAL_RECORDS: '/patients/medical-records',
    CHRONIC_DISEASES: '/patients/chronic-diseases',
  },
  DOCTORS: {
    BASE: '/doctors',
    MY_PATIENTS: '/doctors/my-patients',
    MY_RECORDS: '/doctors/my-records',
    STATISTICS: '/doctors/statistics',
  },
  PHARMACY: {
    BASE: '/pharmacists',
    PENDING: '/pharmacists/pending-prescriptions',
    DISPENSE: '/pharmacists/dispense',
    STATISTICS: '/pharmacists/statistics',
  },
  LAB: {
    BASE: '/lab-techs',
    PENDING: '/lab-techs/pending-tests',
    COMPLETE: '/lab-techs/complete-test',
    STATISTICS: '/lab-techs/statistics',
  },
  RADIOLOGY: {
    BASE: '/radiology-techs',
    PENDING: '/radiology-techs/pending-scans',
    COMPLETE: '/radiology-techs/complete-scan',
    STATISTICS: '/radiology-techs/statistics',
  },
  AI_REVIEWS: {
    BASE: '/ai-reviews',
    REQUEST: '/ai-reviews/request',
    PENDING: '/ai-reviews/pending',
    APPROVE: '/ai-reviews',
    MY_REQUESTS: '/ai-reviews/my-requests',
  },
  FINANCIAL: {
    BASE: '/financial',
    MY_EARNINGS: '/financial/my-earnings',
    TOTAL_EARNINGS: '/financial/total-earnings',
    WITHDRAW: '/financial/withdraw',
    ADMIN_ALL: '/financial/admin/all-earnings',
  },
  ADMIN: {
    BASE: '/admin',
    PENDING_VERIFICATIONS: '/admin/pending-verifications',
    VERIFY_USER: '/admin/verify-user',
    DASHBOARD_STATS: '/admin/dashboard-stats',
    PREDICT_RISK: '/admin/predict-chronic-risk',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
  },
  PRICES: {
    BASE: '/prices',
  },
  ETL: {
    BASE: '/etl',
    EXPORT_ALL: '/etl/export-all',
    EXPORT_CSV: '/etl/export-complete-csv',
    GENERATE_REPORT: '/etl/generate-report',
    EXPORT_ZIP: '/etl/export-all-zip',
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  PHARMACIST: 'pharmacist',
  LAB_TECH: 'lab_tech',
  RADIOLOGY_TECH: 'radiology_tech',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Prescription Status
export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  DISPENSED: 'dispensed',
  CANCELLED: 'cancelled',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// AI Review Status
export const AI_REVIEW_STATUS = {
  PENDING_DOCTOR: 'pending_doctor',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
];

// Doctor Specialties
export const DOCTOR_SPECIALTIES = [
  'باطنة',
  'أطفال',
  'قلب',
  'جراحة',
  'عظام',
  'جلدية',
  'عيون',
  'أسنان',
  'مخ وأعصاب',
  'نفسية',
  'نساء وتوليد',
  'مسالك بولية',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
