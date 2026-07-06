import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ScanRequestForm = ({ onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    patient_id: '',
    scan_type: '',
    body_part: '',
    description: '',
    scheduled_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const scanTypes = [
    t('radiology.scan_types.xray'),
    t('radiology.scan_types.ct'),
    t('radiology.scan_types.mri'),
    t('radiology.scan_types.ultrasound'),
    t('radiology.scan_types.fluoroscopy'),
    t('radiology.scan_types.mammogram'),
    t('radiology.scan_types.dexa'),
  ];

  const bodyParts = [
    t('radiology.body_parts.head'),
    t('radiology.body_parts.chest'),
    t('radiology.body_parts.abdomen'),
    t('radiology.body_parts.spine'),
    t('radiology.body_parts.arm'),
    t('radiology.body_parts.leg'),
    t('radiology.body_parts.knee'),
    t('radiology.body_parts.shoulder'),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('radiology.request_form.patient_id')}</label>
        <input
          type="number"
          value={formData.patient_id}
          onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">{t('radiology.request_form.scan_type')}</label>
        <select
          value={formData.scan_type}
          onChange={(e) => setFormData(prev => ({ ...prev, scan_type: e.target.value }))}
          className="input"
          required
        >
          <option value="">{t('radiology.request_form.select_scan_type')}</option>
          {scanTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t('radiology.request_form.body_part')}</label>
        <select
          value={formData.body_part}
          onChange={(e) => setFormData(prev => ({ ...prev, body_part: e.target.value }))}
          className="input"
          required
        >
          <option value="">{t('radiology.request_form.select_body_part')}</option>
          {bodyParts.map(part => (
            <option key={part} value={part}>{part}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t('radiology.request_form.scheduled_date')}</label>
        <input
          type="datetime-local"
          value={formData.scheduled_date}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
          className="input"
        />
      </div>

      <div>
        <label className="label">{t('radiology.request_form.notes')}</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input"
          rows="3"
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? t('common.loading') : t('radiology.request_form.submit')}
      </button>
    </form>
  );
};

export default ScanRequestForm;
