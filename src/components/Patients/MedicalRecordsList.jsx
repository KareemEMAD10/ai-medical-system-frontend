import React from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const MedicalRecordsList = ({ records, onView, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-3">
      {records.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t('common.no_data')}</p>
      ) : (
        records.map((record) => (
          <div key={record.id} className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {record.diagnosis}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(record.created_at)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {record.chief_complaint}
                </p>
              </div>
              <button
                onClick={() => onView(record)}
                className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MedicalRecordsList;
