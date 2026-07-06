import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const DoctorList = ({ doctors, onView, onEdit, onDelete, onSchedule, isLoading }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.username?.toLowerCase().includes(search.toLowerCase()) ||
                          doctor.email?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = !specialtyFilter || doctor.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold">{t('doctors.title')}</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">{t('doctors.all_specialties')}</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-200">
              <th className="text-right py-3 px-4">{t('doctors.name')}</th>
              <th className="text-right py-3 px-4">{t('auth.email')}</th>
              <th className="text-right py-3 px-4">{t('doctors.specialty')}</th>
              <th className="text-right py-3 px-4">{t('common.actions')}</th>
             </tr>
          </thead>
          <tbody>
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-gray-100 dark:border-dark-200 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                  <td className="py-3 px-4">{doctor.username}</td>
                  <td className="py-3 px-4">{doctor.email}</td>
                  <td className="py-3 px-4">{doctor.specialty || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => onView(doctor)} className="p-1 text-blue-500 hover:text-blue-600">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onEdit(doctor)} className="p-1 text-green-500 hover:text-green-600">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onSchedule(doctor)} className="p-1 text-purple-500 hover:text-purple-600">
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDelete(doctor)} className="p-1 text-red-500 hover:text-red-600">
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

export default DoctorList;
