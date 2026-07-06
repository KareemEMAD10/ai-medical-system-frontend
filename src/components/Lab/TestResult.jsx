import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TestResult = ({ test, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState(test?.result || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ result });
  };

  if (!test) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">{t('common.details')}</h4>
        <p><strong>{t('patients.name')}:</strong> {test.test_name}</p>
        <p><strong>{t('doctors.specialty')}:</strong> {test.test_type}</p>
        <p><strong>{t('patients.title')}:</strong> {test.patient_name}</p>
        <p><strong>{t('common.date')}:</strong> {new Date(test.requested_at).toLocaleDateString()}</p>
        {test.description && <p><strong>{t('common.details')}:</strong> {test.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('patients.diagnosis')}</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="input"
            rows="5"
            placeholder={t('patientDashboard.ai.request_reason_placeholder')}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </form>
    </div>
  );
};

export default TestResult;
