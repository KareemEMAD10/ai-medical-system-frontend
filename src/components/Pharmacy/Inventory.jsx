import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../../utils/helpers';

const Inventory = ({ medications, isLoading }) => {
  const { t } = useTranslation();

  const lowStock = medications.filter(m => m.quantity > 0 && m.quantity < 10);
  const outOfStock = medications.filter(m => m.quantity === 0);

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alert */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          {t('pharmacy.inventory.low_stock_title')}
        </h3>
        {lowStock.length === 0 ? (
          <p className="text-gray-500">{t('pharmacy.inventory.low_stock_empty')}</p>
        ) : (
          <div className="space-y-2">
            {lowStock.map(med => (
              <div key={med.id} className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-gray-500">{t('pharmacy.inventory.quantity')}: {med.quantity}</p>
                </div>
                <p className="font-semibold text-yellow-600">{t('pharmacy.inventory.remaining', { count: med.quantity })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Out of Stock */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          {t('pharmacy.inventory.out_of_stock_title')}
        </h3>
        {outOfStock.length === 0 ? (
          <p className="text-gray-500">{t('pharmacy.inventory.out_of_stock_empty')}</p>
        ) : (
          <div className="space-y-2">
            {outOfStock.map(med => (
              <div key={med.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-gray-500">{t('pharmacy.inventory.price')}: {formatCurrency(med.price)}</p>
                </div>
                <CheckCircleIcon className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
