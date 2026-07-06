import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TestRequestForm = ({ onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    patient_id: '',
    test_type: '',
    test_name: '',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const testTypes = [
    { value: 'cbc', label: t('lab.test_types.cbc') },
    { value: 'liver', label: t('lab.test_types.liver') },
    { value: 'kidney', label: t('lab.test_types.kidney') },
    { value: 'lipid', label: t('lab.test_types.lipid') },
    { value: 'thyroid', label: t('lab.test_types.thyroid') },
    { value: 'vitamin_d', label: t('lab.test_types.vitamin_d') },
    { value: 'iron', label: t('lab.test_types.iron') },
    { value: 'urinalysis', label: t('lab.test_types.urinalysis') },
    { value: 'hba1c', label: t('lab.test_types.hba1c') },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('lab.request.patient_id')}</label>
        <input
          type="number"
          value={formData.patient_id}
          onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">{t('lab.request.test_type')}</label>
        <select
          value={formData.test_type}
          onChange={(e) => setFormData(prev => ({ ...prev, test_type: e.target.value }))}
          className="input"
          required
        >
          <option value="">{t('lab.request.select_type')}</option>
          {testTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t('lab.request.test_name')}</label>
        <input
          type="text"
          value={formData.test_name}
          onChange={(e) => setFormData(prev => ({ ...prev, test_name: e.target.value }))}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">{t('lab.request.notes')}</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input"
          rows="3"
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? t('common.loading') : t('lab.request.submit')}
      </button>
    </form>
  );
};

export default TestRequestForm;
