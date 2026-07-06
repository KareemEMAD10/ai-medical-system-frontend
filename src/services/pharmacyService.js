import api from './api';

export const getPendingPrescriptions = async () => {
  const response = await api.get('/pharmacists/pending-prescriptions');
  return response.data;
};

export const dispensePrescription = async (prescriptionId) => {
  const response = await api.post(`/pharmacists/dispense/${prescriptionId}`);
  return response.data;
};

export const getPharmacistStatistics = async () => {
  const response = await api.get('/pharmacists/statistics');
  return response.data;
};

export const getPrescriptionHistory = async () => {
  const response = await api.get('/pharmacists/history');
  return response.data;
};
