import React from 'react';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../../utils/helpers';

const RecentActivity = ({ activities }) => {
  const { t } = useTranslation();

  const getActivityIcon = (type) => {
    const icons = {
      patient: '👤',
      prescription: '💊',
      test: '🔬',
      scan: '📷',
      review: '🤖',
    };
    return icons[type] || '📋';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{t('ai.recent_activity.title')}</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('ai.recent_activity.empty')}</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {timeAgo(activity.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
