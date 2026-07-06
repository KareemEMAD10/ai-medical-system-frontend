import api from './api';

export const getMyPatients = async () => {
  const response = await api.get('/doctors/my-patients');
  return response.data;
};

export const getMyRecords = async () => {
  const response = await api.get('/doctors/my-records');
  return response.data;
};

export const getDoctorStatistics = async () => {
  const response = await api.get('/doctors/statistics');
  return response.data;
};

export const getDoctorSchedule = async () => {
  const response = await api.get('/doctors/schedule');
  return response.data;
};
