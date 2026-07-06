import React from 'react';
import { useTranslation } from 'react-i18next';
import { UsersIcon, DocumentTextIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const DoctorStats = ({ stats }) => {
  const { t } = useTranslation();

  const statItems = [
    { label: t('doctors.my_patients'), value: stats?.total_patients || 0, icon: <UsersIcon className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: t('doctors.my_records'), value: stats?.total_records || 0, icon: <DocumentTextIcon className="w-6 h-6" />, color: 'bg-green-500' },
    { label: t('dashboard.today_appointments'), value: stats?.today_appointments || 0, icon: <CalendarIcon className="w-6 h-6" />, color: 'bg-purple-500' },
    { label: t('financial.total_earnings'), value: stats?.total_earnings || 0, icon: <CurrencyDollarIcon className="w-6 h-6" />, color: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">
                {item.value}
              </p>
            </div>
            <div className={`${item.color} p-3 rounded-xl text-white`}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoctorStats;
