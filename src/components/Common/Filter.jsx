import React, { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const Filter = ({ filters, onFilterChange, onReset }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <FunnelIcon className="w-5 h-5" />
        <span>{t('common.filter')}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-dark-100 rounded-xl shadow-lg border border-gray-200 dark:border-dark-200 z-20 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{t('common.filter')}</h3>
            <button onClick={() => setIsOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {Object.entries(filters).map(([key, config]) => (
            <div key={key} className="mb-4">
              <label className="label">{config.label}</label>
              {config.type === 'select' ? (
                <select
                  value={config.value}
                  onChange={(e) => onFilterChange(key, e.target.value)}
                  className="input"
                >
                  <option value="">{t('common.all')}</option>
                  {config.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={config.type || 'text'}
                  value={config.value}
                  onChange={(e) => onFilterChange(key, e.target.value)}
                  placeholder={config.placeholder}
                  className="input"
                />
              )}
            </div>
          ))}
          
          <button onClick={onReset} className="btn-secondary w-full mt-2">
            {t('common.reset')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Filter;
