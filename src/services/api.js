import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const API_BASE_URL = `${
  import.meta.env.VITE_API_URL
}/api/v1`;
console.log("API URL:", import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,   
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getApiErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return null;
  const detail = data.detail ?? data.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) return item.msg;
        if (item?.detail) return item.detail;
        return JSON.stringify(item);
      })
      .join(' | ');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return null;
};

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ====== معالجة أخطاء الشبكة ======
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('⚠️ Network error detected:', error.message);
      
      // منع ظهور Toast مكرر
      if (!error._handled) {
        error._handled = true;
        toast.error(i18n.t('errors.network_error'));
      }
      
      // إضافة علامة للتعرف على خطأ الشبكة
      error.isNetworkError = true;
      return Promise.reject(error);
    }
    
    // ====== معالجة 401 Unauthorized ======
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error(i18n.t('errors.session_expired'));
    } 
    // ====== معالجة 403 Forbidden ======
    else if (error.response?.status === 403) {
      toast.error(i18n.t('errors.forbidden'));
    } 
    // ====== معالجة 404 Not Found ======
    else if (error.response?.status === 404) {
      // منع Toast للـ 404 في بعض الحالات (زي لما البيانات تكون فاضية)
      if (error.config?.url?.includes('/patients/') && error.config?.url?.includes('/lab-results')) {
        // سكوت للـ 404 في التحاليل (يعني مفيش تحاليل)
        console.warn('⚠️ No lab results found (404)');
        error.isNotFound = true;
        return Promise.reject(error);
      }
      if (error.config?.url?.includes('/patients/') && error.config?.url?.includes('/prescriptions')) {
        console.warn('⚠️ No prescriptions found (404)');
        error.isNotFound = true;
        return Promise.reject(error);
      }
      if (error.config?.url?.includes('/patients/') && error.config?.url?.includes('/appointments')) {
        console.warn('⚠️ No appointments found (404)');
        error.isNotFound = true;
        return Promise.reject(error);
      }
      if (error.config?.url?.includes('/patients/') && error.config?.url?.includes('/radiology-results')) {
        console.warn('⚠️ No radiology results found (404)');
        error.isNotFound = true;
        return Promise.reject(error);
      }
      if (error.config?.url?.includes('/patients/') && error.config?.url?.includes('/summary')) {
        console.warn('⚠️ No summary found (404)');
        error.isNotFound = true;
        return Promise.reject(error);
      }
      toast.error(i18n.t('errors.not_found'));
    } 
    // ====== معالجة 500 Internal Server Error ======
    else if (error.response?.status === 500) {
      toast.error(i18n.t('errors.server_error'));
    } 
    // ====== معالجة 429 Too Many Requests ======
    else if (error.response?.status === 429) {
      toast.error(i18n.t('errors.too_many_requests'));
    } 
    // ====== معالجة الأخطاء الأخرى ======
    else {
      const apiErrorMessage = getApiErrorMessage(error);
      if (apiErrorMessage) {
        toast.error(apiErrorMessage);
      } else {
        console.error('❌ Unhandled API Error:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;