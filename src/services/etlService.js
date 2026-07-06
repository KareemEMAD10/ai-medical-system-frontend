import api from './api';

export const exportAllData = async () => {
  const response = await api.post('/etl/export-all');
  return response.data;
};

export const exportCompleteCSV = async () => {
  const response = await api.post('/etl/export-complete-csv');
  return response.data;
};

export const generateReport = async () => {
  const response = await api.post('/etl/generate-report');
  return response.data;
};

export const exportAllZip = async () => {
  const response = await api.post('/etl/export-all-zip', {}, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadFile = (filename) => {
  return api.get(`/etl/download-csv/${filename}`, {
    responseType: 'blob',
  });
};
