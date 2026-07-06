import api from './api';

export const getPendingTests = async () => {
  const response = await api.get('/lab-techs/pending-tests');
  return response.data;
};

export const completeTest = async (testId, result) => {
  const response = await api.post(`/lab-techs/complete-test/${testId}`, { result });
  return response.data;
};

export const getLabStatistics = async () => {
  const response = await api.get('/lab-techs/statistics');
  return response.data;
};
