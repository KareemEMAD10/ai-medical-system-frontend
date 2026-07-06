import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon } from '@heroicons/react/24/outline';

const DoctorSchedule = ({ schedule, onBook, isLoading }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState('');

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{t('doctorSchedule.title')}</h3>

      <div className="mb-4">
        <label className="label">{t('doctorSchedule.select_date')}</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input"
        />
      </div>

      <div className="space-y-3">
        {schedule.length === 0 ? (
          <p className="text-center text-gray-500 py-4">{t('doctorSchedule.empty')}</p>
        ) : (
          schedule.map((slot, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span>{slot.time}</span>
              </div>
              <button
                onClick={() => onBook(slot)}
                className="btn-primary py-1 px-3 text-sm"
              >
                {t('doctorSchedule.book')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorSchedule;
