import api from './api';

export const requestAIReview = async (medicalRecordId, reason) => {
  const response = await api.post('/ai-reviews/request', {
    medical_record_id: medicalRecordId,
    request_reason: reason,
  });
  return response.data;
};

export const getPendingReviews = async () => {
  const response = await api.get('/ai-reviews/pending');
  return response.data;
};

export const approveReview = async (reviewId, approve) => {
  const response = await api.post(`/ai-reviews/${reviewId}/approve`, { approve });
  return response.data;
};

export const getMyAIRequests = async () => {
  const response = await api.get('/ai-reviews/my-requests');
  return response.data;
};

export const explainDiagnosis = async (recordId) => {
  const response = await api.post(`/ai/explain-diagnosis/${recordId}`);
  return response.data;
};

export const suggestMedications = async (diagnosis) => {
  const response = await api.post('/ai/suggest-medications', { diagnosis });
  return response.data;
};
