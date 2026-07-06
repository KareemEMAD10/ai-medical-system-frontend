import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const ChangePassword = ({ onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.current_password) {
      newErrors.current_password = t('profile.validation.current_password_required');
    }
    if (!formData.new_password) {
      newErrors.new_password = t('profile.validation.new_password_required');
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = t('profile.validation.new_password_length');
    }
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = t('profile.validation.passwords_not_match');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <KeyIcon className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold">{t('profile.change_password')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('profile.current_password')}</label>
          <div className="relative">
            <LockClosedIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={formData.current_password}
              onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
              className="input pr-10"
              required
            />
          </div>
          {errors.current_password && (
            <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
          )}
        </div>

        <div>
          <label className="label">{t('profile.new_password')}</label>
          <div className="relative">
            <LockClosedIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
              className="input pr-10"
              required
            />
          </div>
          {errors.new_password && (
            <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
          )}
        </div>

        <div>
          <label className="label">{t('auth.confirm_password')}</label>
          <div className="relative">
            <LockClosedIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="input pr-10"
              required
            />
          </div>
          {errors.confirm_password && (
            <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? t('common.loading') : t('profile.change_password_button')}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
