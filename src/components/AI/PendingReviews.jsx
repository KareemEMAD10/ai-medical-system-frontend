import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

const PendingReviews = ({ reviews, onApprove, onReject, onView, isLoading }) => {
  const { t } = useTranslation();

  const handleApprove = (review) => {
    if (window.confirm(t('ai.pending_reviews.confirm_approve'))) {
      onApprove(review);
    }
  };

  const handleReject = (review) => {
    if (window.confirm(t('ai.pending_reviews.confirm_reject'))) {
      onReject(review);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-3">
      {reviews.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">{t('ai.pending_reviews.empty')}</p>
        </div>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="card p-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-semibold">{t('ai.pending_reviews.patient_label', { patientName: review.patient_name })}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{t('ai.pending_reviews.request_reason_label')}</strong> {review.request_reason}
                </p>
                <p className="text-sm text-gray-500">
                  {t('ai.pending_reviews.medical_record_label', { id: review.medical_record_id })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(review)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleApprove(review)}
                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleReject(review)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PendingReviews;
