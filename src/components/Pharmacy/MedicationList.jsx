import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/helpers';

const MedicationList = ({ medications, onView, onEdit, onDelete, isLoading }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredMeds = medications.filter(med =>
    med.name?.toLowerCase().includes(search.toLowerCase()) ||
    med.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { label: t('pharmacy.inventory.statuses.out_of_stock'), color: 'bg-red-100 text-red-800' };
    if (quantity < 10) return { label: t('pharmacy.inventory.statuses.low_stock'), color: 'bg-yellow-100 text-yellow-800' };
    return { label: t('pharmacy.inventory.statuses.available'), color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold">{t('pharmacy.medications')}</h3>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-200">
              <th className="text-right py-3 px-4">{t('pharmacy.medications_table.name')}</th>
              <th className="text-right py-3 px-4">{t('pharmacy.medications_table.category')}</th>
              <th className="text-right py-3 px-4">{t('pharmacy.medications_table.price')}</th>
              <th className="text-right py-3 px-4">{t('pharmacy.medications_table.quantity')}</th>
              <th className="text-right py-3 px-4">{t('pharmacy.medications_table.status')}</th>
              <th className="text-right py-3 px-4">{t('common.actions')}</th>
             </tr>
          </thead>
          <tbody>
            {filteredMeds.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              filteredMeds.map((med) => {
                const stock = getStockStatus(med.quantity);
                return (
                  <tr key={med.id} className="border-b border-gray-100 dark:border-dark-200 hover:bg-gray-50 dark:hover:bg-dark-200">
                    <td className="py-3 px-4">{med.name}</td>
                    <td className="py-3 px-4">{med.category || '—'}</td>
                    <td className="py-3 px-4">{formatCurrency(med.price)}</td>
                    <td className="py-3 px-4">{med.quantity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${stock.color}`}>
                        {stock.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => onView(med)} className="p-1 text-blue-500">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onEdit(med)} className="p-1 text-green-500">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDelete(med)} className="p-1 text-red-500">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicationList;
