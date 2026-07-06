import React from 'react';
import { useTranslation } from 'react-i18next';
import { CpuChipIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const AIResponse = ({ review, onClose }) => {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (review?.status) {
      case 'completed':
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-8 h-8 text-red-500" />;
      case 'approved':
        return <ClockIcon className="w-8 h-8 text-yellow-500" />;
      default:
        return <CpuChipIcon className="w-8 h-8 text-primary-500" />;
    }
  };

  const getStatusText = () => {
    switch (review?.status) {
      case 'pending_doctor':
        return t('ai.review_response.statuses.pending_doctor');
      case 'approved':
        return t('ai.review_response.statuses.approved');
      case 'rejected':
        return t('ai.review_response.statuses.rejected');
      case 'completed':
        return t('ai.review_response.statuses.completed');
      default:
        return t('ai.review_response.unknown_status');
    }
  };

  if (!review) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold">{t('ai.review_response.title')}</h3>
            <p className="text-sm text-gray-500">
              {t('common.status')}: {getStatusText()}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">{t('ai.review_response.reason_label')}</p>
          <p>{review.request_reason}</p>
        </div>

        {review.ai_response && (
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CpuChipIcon className="w-5 h-5 text-primary-600" />
              <p className="font-semibold text-primary-600">{t('ai.review_response.analysis_title')}</p>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {review.ai_response.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>{t('ai.review_response.requested_on')}: {new Date(review.created_at).toLocaleString()}</p>
          {review.completed_at && (
            <p>{t('ai.review_response.completed_on')}: {new Date(review.completed_at).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponse;
