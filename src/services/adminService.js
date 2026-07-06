import api from './api';

export const getPendingVerifications = async () => {
  const response = await api.get('/admin/pending-verifications');
  return response.data;
};

export const verifyUser = async (userId) => {
  const response = await api.post(`/admin/verify-user/${userId}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard-stats');
  return response.data;
};

export const predictChronicRisk = async (patientData) => {
  const response = await api.post('/admin/predict-chronic-risk', patientData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
