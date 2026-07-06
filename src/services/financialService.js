import api from './api';

export const getMyEarnings = async () => {
  const response = await api.get('/financial/my-earnings');
  return response.data;
};

export const getTotalEarnings = async () => {
  const response = await api.get('/financial/total-earnings');
  return response.data;
};

export const requestWithdrawal = async (amount) => {
  const response = await api.post(`/financial/withdraw?amount=${amount}`);
  return response.data;
};

export const getAllEarningsAdmin = async () => {
  const response = await api.get('/financial/admin/all-earnings');
  return response.data;
};
