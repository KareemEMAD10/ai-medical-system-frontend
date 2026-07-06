import React from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';

const PrescriptionList = ({ prescriptions, onView, onDispense, onCancel, isLoading, userRole }) => {
  const { t } = useTranslation();

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      dispensed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-3">
      {prescriptions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t('common.no_data')}</p>
      ) : (
        prescriptions.map((pres) => (
          <div key={pres.id} className="card p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{t('pharmacy.prescription.prescription_number', { id: pres.id })}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(pres.status)}`}>
                    {pres.status === 'pending' ? t('pharmacy.prescription.statuses.pending') : pres.status === 'dispensed' ? t('pharmacy.prescription.statuses.dispensed') : t('pharmacy.prescription.statuses.cancelled')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(pres.created_at)} | {formatCurrency(pres.total_amount)}
                </p>
                {pres.medications && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {pres.medications}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onView(pres)} className="p-2 text-blue-500">
                  <EyeIcon className="w-5 h-5" />
                </button>
                {userRole === 'pharmacist' && pres.status === 'pending' && (
                  <button onClick={() => onDispense(pres)} className="p-2 text-green-500">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                )}
                {userRole === 'doctor' && pres.status === 'pending' && (
                  <button onClick={() => onCancel(pres)} className="p-2 text-red-500">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PrescriptionList;
