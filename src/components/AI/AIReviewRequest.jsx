import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CpuChipIcon } from '@heroicons/react/24/outline';

const AIReviewRequest = ({ medicalRecords, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    medical_record_id: '',
    request_reason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <CpuChipIcon className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold">{t('ai.review_request.title')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('ai.review_request.medical_record_label')}</label>
          <select
            value={formData.medical_record_id}
            onChange={(e) => setFormData(prev => ({ ...prev, medical_record_id: e.target.value }))}
            className="input"
            required
          >
            <option value="">{t('ai.review_request.medical_record_placeholder')}</option>
            {medicalRecords.map(record => (
              <option key={record.id} value={record.id}>
                {record.diagnosis} - {new Date(record.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t('ai.review_request.reason_label')}</label>
          <textarea
            value={formData.request_reason}
            onChange={(e) => setFormData(prev => ({ ...prev, request_reason: e.target.value }))}
            className="input"
            rows="4"
            placeholder={t('ai.review_request.reason_placeholder')}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? t('common.loading') : t('ai.review_request.submit')}
        </button>
      </form>
    </div>
  );
};

export default AIReviewRequest;
