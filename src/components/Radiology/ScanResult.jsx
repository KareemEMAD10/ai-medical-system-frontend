import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ScanResult = ({ scan, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState(scan?.result || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ result });
  };

  if (!scan) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">{t('common.details')}</h4>
        <p><strong>{t('radiology.title')}:</strong> {scan.scan_type}</p>
        <p><strong>{t('common.details')}:</strong> {scan.body_part}</p>
        <p><strong>{t('patients.title')}:</strong> {scan.patient_name}</p>
        <p><strong>{t('common.date')}:</strong> {new Date(scan.requested_at).toLocaleDateString()}</p>
        {scan.scheduled_date && (
          <p><strong>{t('common.date')}:</strong> {new Date(scan.scheduled_date).toLocaleDateString()}</p>
        )}
        {scan.description && <p><strong>{t('common.details')}:</strong> {scan.description}</p>}
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

export default ScanResult;
