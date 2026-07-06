import React from 'react';
import { useTranslation } from 'react-i18next';
import { BeakerIcon, CurrencyDollarIcon, CubeIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/helpers';

const MedicationCard = ({ medication, onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onClick(medication)}
      className="card cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <BeakerIcon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {medication.name}
          </h3>
          {medication.category && (
            <p className="text-sm text-gray-500 mt-1">{medication.category}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>{formatCurrency(medication.price)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CubeIcon className="w-4 h-4" />
              <span>{t('components.medicationCard.quantity')}: {medication.quantity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
