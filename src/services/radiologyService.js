import api from './api';

export const getPendingScans = async () => {
  const response = await api.get('/radiology-techs/pending-scans');
  return response.data;
};

export const completeScan = async (scanId, result) => {
  const response = await api.post(`/radiology-techs/complete-scan/${scanId}`, { result });
  return response.data;
};

export const getRadiologyStatistics = async () => {
  const response = await api.get('/radiology-techs/statistics');
  return response.data;
};
