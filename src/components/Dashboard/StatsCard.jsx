import React from 'react';
import { useTranslation } from 'react-i18next';

const StatsCard = ({ title, value, icon, color = 'primary', change }) => {
  const { t } = useTranslation();
  const colors = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? `+${change}` : change}% {t('components.statsCard.fromLastMonth')}
            </p>
          )}
        </div>
        <div className={`${colors[color]} p-3 rounded-xl text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
