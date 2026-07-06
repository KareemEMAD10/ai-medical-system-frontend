import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon, BellIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const NotificationList = ({ notifications, onMarkAsRead, onMarkAllRead, onDelete, isLoading }) => {
  const { t } = useTranslation();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return t('notifications.time_just_now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('notifications.time_minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notifications.time_hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('notifications.time_days', { count: days });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="w-80 max-h-96 overflow-y-auto bg-white dark:bg-dark-100 rounded-xl shadow-lg">
      <div className="sticky top-0 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-dark-200 p-3 flex justify-between items-center">
        <h3 className="font-semibold">{t('notifications.title')}</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary-500 hover:text-primary-600"
          >
            {t('notifications.mark_all_read')}
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-dark-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('notifications.empty')}</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors ${!notification.is_read ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getTimeAgo(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
