import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const PatientList = ({ patients, onView, onEdit, onDelete, isLoading }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.username?.toLowerCase().includes(search.toLowerCase()) ||
    patient.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold">{t('patients.title')}</h3>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-200">
              <th className="text-right py-3 px-4">{t('patients.name')}</th>
              <th className="text-right py-3 px-4">{t('auth.email')}</th>
              <th className="text-right py-3 px-4">{t('patients.phone')}</th>
              <th className="text-right py-3 px-4">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 dark:border-dark-200 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                  <td className="py-3 px-4">{patient.username}</td>
                  <td className="py-3 px-4">{patient.email}</td>
                  <td className="py-3 px-4">{patient.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => onView(patient)} className="p-1 text-blue-500 hover:text-blue-600">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onEdit(patient)} className="p-1 text-green-500 hover:text-green-600">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDelete(patient)} className="p-1 text-red-500 hover:text-red-600">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
