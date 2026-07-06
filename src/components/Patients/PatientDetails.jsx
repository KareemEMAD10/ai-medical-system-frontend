import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/helpers';

const PatientDetails = ({ patient }) => {
  const { t } = useTranslation();
  if (!patient) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('patients.name')}</label>
          <p className="text-gray-800 dark:text-gray-200">{patient.username}</p>
        </div>
        <div>
          <label className="label">{t('auth.email')}</label>
          <p className="text-gray-800 dark:text-gray-200">{patient.email}</p>
        </div>
        <div>
          <label className="label">{t('patients.gender')}</label>
          <p className="text-gray-800 dark:text-gray-200">
            {patient.gender === 'male' ? t('gender.male') : patient.gender === 'female' ? t('gender.female') : '—'}
          </p>
        </div>
        <div>
          <label className="label">{t('patients.registration_date')}</label>
          <p className="text-gray-800 dark:text-gray-200">
            {formatDate(patient.created_at)}
          </p>
        </div>
        <div>
          <label className="label">{t('patients.status')}</label>
          <p className="text-gray-800 dark:text-gray-200">
            {patient.is_verified ? t('patients.verified') : t('patients.unverified')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
