import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MedicalRecordForm = ({ onSubmit, initialData, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData || {
    chief_complaint: '',
    symptoms: [],
    vital_signs: {},
    differential_diagnosis: [],
    diagnosis: '',
    treatment_plan: '',
    is_chronic: false,
  });
  const [newSymptom, setNewSymptom] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      handleChange('symptoms', [...formData.symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const removeSymptom = (index) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms.splice(index, 1);
    handleChange('symptoms', newSymptoms);
  };

  const addDiagnosis = () => {
    if (newDiagnosis.trim()) {
      handleChange('differential_diagnosis', [...formData.differential_diagnosis, newDiagnosis.trim()]);
      setNewDiagnosis('');
    }
  };

  const removeDiagnosis = (index) => {
    const newDiagnoses = [...formData.differential_diagnosis];
    newDiagnoses.splice(index, 1);
    handleChange('differential_diagnosis', newDiagnoses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('patients.chief_complaint')}</label>
        <textarea
          value={formData.chief_complaint}
          onChange={(e) => handleChange('chief_complaint', e.target.value)}
          className="input"
          rows="3"
          required
        />
      </div>

      <div>
        <label className="label">{t('patients.symptoms')}</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            className="input flex-1"
            placeholder={t('patients.symptom_placeholder')}
          />
          <button type="button" onClick={addSymptom} className="btn-primary">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.symptoms.map((symptom, index) => (
            <span key={index} className="bg-gray-100 dark:bg-dark-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {symptom}
              <button type="button" onClick={() => removeSymptom(index)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t('patients.diagnosis')}</label>
        <input
          type="text"
          value={formData.diagnosis}
          onChange={(e) => handleChange('diagnosis', e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">{t('patients.treatment_plan')}</label>
        <textarea
          value={formData.treatment_plan}
          onChange={(e) => handleChange('treatment_plan', e.target.value)}
          className="input"
          rows="3"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_chronic"
          checked={formData.is_chronic}
          onChange={(e) => handleChange('is_chronic', e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="is_chronic">{t('patients.chronic_diseases')}</label>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? t('common.loading') : t('common.save')}
      </button>
    </form>
  );
};

export default MedicalRecordForm;
