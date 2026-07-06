import i18n from '../i18n';

export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone) => {
  const regex = /^01[0-2]\d{8}$/;
  return regex.test(phone);
};

export const isValidPassword = (password) => {
  if (password.length < 6) return false;
  if (!/\d/.test(password)) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  return true;
};

export const isValidNationalId = (id) => {
  const regex = /^\d{14}$/;
  return regex.test(id);
};

export const isValidName = (name) => {
  const regex = /^[\u0621-\u064A\u0660-\u0669a-zA-Z\s]+$/;
  return regex.test(name) && name.length >= 2;
};

export const validateMedicalRecord = (data) => {
  const errors = {};
  if (!data.chief_complaint?.trim()) {
    errors.chief_complaint = i18n.t('validations.chief_complaint_required');
  }
  if (!data.diagnosis?.trim()) {
    errors.diagnosis = i18n.t('validations.diagnosis_required');
  }
  if (!data.symptoms || data.symptoms.length === 0) {
    errors.symptoms = i18n.t('validations.symptoms_required');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validatePrescription = (data) => {
  const errors = {};
  if (!data.patient_id) {
    errors.patient_id = i18n.t('validations.patient_required');
  }
  if (!data.medications?.trim()) {
    errors.medications = i18n.t('validations.medications_required');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validatePrice = (data) => {
  const errors = {};
  if (!data.role) {
    errors.role = i18n.t('validations.role_required');
  }
  if (!data.service_type) {
    errors.service_type = i18n.t('validations.service_type_required');
  }
  if (data.base_price <= 0) {
    errors.base_price = i18n.t('validations.price_positive');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateLogin = (data) => {
  const errors = {};
  if (!data.email) {
    errors.email = i18n.t('validations.email_required');
  } else if (!isValidEmail(data.email)) {
    errors.email = i18n.t('validations.email_invalid');
  }
  if (!data.password) {
    errors.password = i18n.t('validations.password_required');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateRegister = (data) => {
  const errors = {};
  if (!data.username) {
    errors.username = i18n.t('validations.username_required');
  } else if (data.username.length < 3) {
    errors.username = i18n.t('validations.username_min_length');
  }
  if (!data.email) {
    errors.email = i18n.t('validations.email_required');
  } else if (!isValidEmail(data.email)) {
    errors.email = i18n.t('validations.email_invalid');
  }
  if (!data.password) {
    errors.password = i18n.t('validations.password_required');
  } else if (!isValidPassword(data.password)) {
    errors.password = i18n.t('validations.password_complexity');
  }
  if (data.password !== data.confirm_password) {
    errors.confirm_password = i18n.t('validations.passwords_not_match');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};
