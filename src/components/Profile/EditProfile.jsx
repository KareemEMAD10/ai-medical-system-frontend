import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

const EditProfile = ({ user, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    specialty: user?.specialty || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <UserCircleIcon className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold">{t('profile.edit_profile')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('profile.username')}</label>
          <div className="relative">
            <UserIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="input pr-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">{t('auth.email')}</label>
          <div className="relative">
            <EnvelopeIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input pr-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">{t('profile.phone')}</label>
          <div className="relative">
            <PhoneIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="input pr-10"
              placeholder={t('profile.phone_placeholder')}
            />
          </div>
        </div>

        <div>
          <label className="label">{t('patients.gender')}</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="input"
          >
            <option value="">{t('common.select')}</option>
            <option value="male">{t('gender.male')}</option>
            <option value="female">{t('gender.female')}</option>
          </select>
        </div>

        {user?.role === 'doctor' && (
          <div>
            <label className="label">{t('doctors.specialty')}</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
              className="input"
              placeholder={t('profile.specialty_placeholder')}
            />
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
