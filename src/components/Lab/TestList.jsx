import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, EyeIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const TestList = ({ tests, onView, onComplete, isLoading, userRole }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return t('lab.tests.statuses.pending');
      case 'in_progress':
        return t('lab.tests.statuses.in_progress');
      case 'completed':
        return t('lab.tests.statuses.completed');
      default:
        return t('common.status');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold">{t('lab.tests.title')}</h3>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-40"
          >
            <option value="">{t('lab.tests.all')}</option>
            <option value="pending">{t('lab.tests.statuses.pending')}</option>
            <option value="in_progress">{t('lab.tests.statuses.in_progress')}</option>
            <option value="completed">{t('lab.tests.statuses.completed')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('common.no_data')}</p>
        ) : (
          filteredTests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
              <div className="flex items-center gap-3">
                <BeakerIcon className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium">{test.test_name}</p>
                  <p className="text-sm text-gray-500">
                    {test.patient_name} | {formatDate(test.requested_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(test.status)}`}>
                  {getStatusLabel(test.status)}
                </span>
                <button onClick={() => onView(test)} className="p-2 text-blue-500">
                  <EyeIcon className="w-5 h-5" />
                </button>
                {userRole === 'lab_tech' && test.status === 'pending' && (
                  <button onClick={() => onComplete(test)} className="btn-primary py-1 px-3 text-sm">
                    {t('lab.tests.actions.add_result')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestList;
