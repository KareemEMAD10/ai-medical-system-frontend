import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PrescriptionForm = ({ onSubmit, medications, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    patient_id: '',
    medications: [],
    instructions: '',
  });
  const [selectedMed, setSelectedMed] = useState('');
  const [dosage, setDosage] = useState('');

  const addMedication = () => {
    if (selectedMed && dosage) {
      const med = medications.find(m => m.id === parseInt(selectedMed));
      if (med) {
        setFormData(prev => ({
          ...prev,
          medications: [...prev.medications, { ...med, dosage, quantity: 1 }]
        }));
        setSelectedMed('');
        setDosage('');
      }
    }
  };

  const removeMedication = (index) => {
    const newMeds = [...formData.medications];
    newMeds.splice(index, 1);
    setFormData(prev => ({ ...prev, medications: newMeds }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('pharmacy.prescription.patient')}</label>
        <input
          type="number"
          value={formData.patient_id}
          onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">{t('pharmacy.prescription.add_medication')}</label>
        <div className="flex gap-2">
          <select
            value={selectedMed}
            onChange={(e) => setSelectedMed(e.target.value)}
            className="input flex-1"
          >
            <option value="">{t('pharmacy.prescription.select_medication')}</option>
            {medications.map(med => (
              <option key={med.id} value={med.id}>{med.name} - {med.price} {t('pharmacy.prescription.currency')}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t('pharmacy.prescription.dosage_placeholder')}
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="input w-32"
          />
          <button type="button" onClick={addMedication} className="btn-primary">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {formData.medications.map((med, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div>
              <span className="font-medium">{med.name}</span>
              <span className="text-sm text-gray-500 mr-2">({med.dosage})</span>
              <span className="text-sm text-primary-500 mr-2">{med.price} {t('pharmacy.prescription.currency')}</span>
            </div>
            <button type="button" onClick={() => removeMedication(index)}>
              <XMarkIcon className="w-5 h-5 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="label">{t('pharmacy.prescription.instructions')}</label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          className="input"
          rows="3"
        />
      </div>

      <div className="border-t pt-3">
        <p className="text-right font-semibold">
          {t('pharmacy.prescription.total')}: {formData.medications.reduce((sum, m) => sum + m.price, 0)} {t('pharmacy.prescription.currency')}
        </p>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? t('common.loading') : t('pharmacy.prescription.submit')}
      </button>
    </form>
  );
};

export default PrescriptionForm;
