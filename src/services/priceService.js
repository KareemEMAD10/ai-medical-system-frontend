import api from './api';

export const getPrices = async () => {
  const response = await api.get('/prices/');
  return response.data;
};

export const getPrice = async (role, serviceType) => {
  const response = await api.get(`/prices/${role}/${serviceType}`);
  return response.data;
};

export const createPrice = async (data) => {
  const response = await api.post('/prices/', data);
  return response.data;
};

export const updatePrice = async (priceId, data) => {
  const response = await api.put(`/prices/${priceId}`, data);
  return response.data;
};

export const deletePrice = async (priceId) => {
  const response = await api.delete(`/prices/${priceId}`);
  return response.data;
};
