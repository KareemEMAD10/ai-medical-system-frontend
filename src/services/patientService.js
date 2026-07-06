import api from './api';

export const getMedicalRecords = async () => {
  const response = await api.get('/patients/medical-records');
  return response.data;
};

export const getPatientRecords = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/medical-records`);
  return response.data;
};

export const createMedicalRecord = async (data) => {
  const response = await api.post('/patients/medical-records', data);
  return response.data;
};

export const getChronicDiseases = async () => {
  const response = await api.get('/patients/chronic-diseases');
  return response.data;
};

export const getPatientDetails = async (patientId) => {
  const response = await api.get(`/patients/${patientId}`);
  return response.data;
};

export const updatePatient = async (patientId, data) => {
  const response = await api.put(`/patients/${patientId}`, data);
  return response.data;
};
