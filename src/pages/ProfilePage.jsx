import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next'; 
import Layout from '../components/Layout/Layout';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // ===== Form States =====
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    gender: '',
    specialty: '',
    facility_name: '',
    license_number: '',
    national_id: '',
    phone: '',
    profile_picture: null,
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const getRoleLabel = (r) => ({
    admin: t('profilePage.roleLabels.admin'), doctor: t('profilePage.roleLabels.doctor'), patient: t('profilePage.roleLabels.patient'),
    pharmacist: t('profilePage.roleLabels.pharmacist'), lab_tech: t('profilePage.roleLabels.labTech'), radiology_tech: t('profilePage.roleLabels.radiologyTech')
  }[r] || r);

  const getRoleColor = (r) => ({
    admin:          'from-red-500 to-rose-600',
    doctor:         'from-blue-500 to-indigo-600',
    patient:        'from-emerald-500 to-teal-600',
    pharmacist:     'from-purple-500 to-violet-600',
    lab_tech:       'from-orange-500 to-amber-600',
    radiology_tech: 'from-teal-500 to-cyan-600',
  }[r] || 'from-gray-500 to-gray-600');

  const getRoleIcon = (r) => ({
    admin: '🛡️', doctor: '👨‍⚕️', patient: '🏥',
    pharmacist: '💊', lab_tech: '🔬', radiology_tech: '📷'
  }[r] || '👤');

  // ===== Load user data =====
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        gender: user.gender || '',
        specialty: user.specialty || '',
        facility_name: user.facility_name || '',
        license_number: user.license_number || '',
        national_id: user.national_id || '',
        phone: user.phone || '',
        profile_picture: user.profile_picture || null,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Load profile image
      if (user.profile_picture) {
        if (user.profile_picture.startsWith('data:image')) {
          setProfileImage(user.profile_picture);
        } else if (user.profile_picture.startsWith('http')) {
          setProfileImage(user.profile_picture);
        } else {
          setProfileImage(`http://localhost:8000${user.profile_picture}`);
        }
      } else {
        setProfileImage(null);
      }
    }
  }, [user]);

  // ===== Handle file selection =====
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t('profilePage.messages.invalidImageType'));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profilePage.messages.imageTooLarge'));
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== Update Profile =====
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // إضافة الحقول النصية
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('specialty', formData.specialty || '');
      formDataToSend.append('facility_name', formData.facility_name || '');
      formDataToSend.append('license_number', formData.license_number || '');
      formDataToSend.append('national_id', formData.national_id || '');
      formDataToSend.append('phone', formData.phone || '');
      
      // إضافة الصورة لو تم اختيارها
      if (selectedFile) {
        formDataToSend.append('profile_picture', selectedFile);
      }
      
      const response = await api.put('/users/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // تحديث بيانات المستخدم
      updateUser(response.data);
      
      // تحديث الصورة المعروضة
      if (response.data.profile_picture) {
        if (response.data.profile_picture.startsWith('data:image')) {
          setProfileImage(response.data.profile_picture);
        } else if (response.data.profile_picture.startsWith('http')) {
          setProfileImage(response.data.profile_picture);
        } else {
          setProfileImage(`http://localhost:8000${response.data.profile_picture}`);
        }
      }
      
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast.success(t('profilePage.messages.updateSuccess'));
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.detail || t('profilePage.messages.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Change Password =====
 // ===== Change Password =====
const handleChangePassword = async (e) => {
  e.preventDefault();
  
  if (formData.new_password !== formData.confirm_password) {
    toast.error(t('profilePage.messages.passwordMismatch'));
    return;
  }
  
  if (formData.new_password.length < 6) {
    toast.error(t('profilePage.messages.passwordTooShort'));
    return;
  }
  
  setIsLoading(true);
  
  try {
    await api.put('/users/change-password', {
      current_password: formData.current_password,
      new_password: formData.new_password
    });
    
    toast.success(t('profilePage.messages.passwordChanged'));
    
    localStorage.removeItem('token');
    logout();
    navigate('/login');
    
  } catch (error) {
    console.error('Change password error:', error);
    toast.error(error.response?.data?.detail || t('profilePage.messages.passwordChangeFailed'));
  } finally {
    setIsLoading(false);
  }
};

  // ===== Remove Profile Picture =====
  const handleRemovePicture = async () => {
    if (!confirm(t('profilePage.messages.confirmDeletePicture'))) return;
    
    setIsLoading(true);
    try {
      await api.delete('/users/profile-picture');
      
      setProfileImage(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // تحديث بيانات المستخدم
      if (user) {
        const updatedUser = { ...user, profile_picture: null };
        updateUser(updatedUser);
      }
      
      toast.success(t('profilePage.messages.pictureDeleted'));
    } catch (error) {
      console.error('Remove picture error:', error);
      toast.error(t('profilePage.messages.pictureDeleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('profile.edit_profile'), icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: 'password', label: t('profile.change_password'), icon: <KeyIcon className="w-5 h-5" /> },
  ];

  // ===== Current profile image to display =====
  const currentImage = previewUrl || profileImage;

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">

        {/* ===== Profile Header Card ===== */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          {/* Top Gradient Banner */}
          <div className={`h-24 bg-gradient-to-r ${getRoleColor(user?.role)}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16 blur-2xl"></div>
          </div>

          {/* Avatar & Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              {/* Avatar with Upload */}
              <div className="relative group">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRoleColor(user?.role)} flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-800 flex-shrink-0 overflow-hidden`}>
                  {currentImage && !imageError ? (
                    <img 
                      src={currentImage} 
                      alt={user?.username}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-3xl">{getRoleIcon(user?.role)}</span>
                  )}
                  
                  {/* Upload Overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-2xl">
                    <CameraIcon className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                
                {/* Remove button */}
                {currentImage && (
                  <button
                    onClick={handleRemovePicture}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs shadow-lg"
                    title={t('profilePage.labels.deletePicture')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mb-1 flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                  {user?.username}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${getRoleColor(user?.role)} shadow-sm`}>
                    {getRoleIcon(user?.role)} {getRoleLabel(user?.role)}
                  </span>
                  {user?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheckIcon className="w-3 h-3" /> {t('profilePage.labels.verified')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user?.email && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">📧</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.email')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">📱</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.phone')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.phone}</p>
                  </div>
                </div>
              )}
              {user?.national_id && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">🪪</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.nationalId')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.national_id}</p>
                  </div>
                </div>
              )}
              {user?.specialty && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">🎓</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.specialty')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.specialty}</p>
                  </div>
                </div>
              )}
              {user?.facility_name && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">🏢</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.facility')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.facility_name}</p>
                  </div>
                </div>
              )}
              {user?.gender && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-base">{user.gender === 'male' ? '👨' : '👩'}</span>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('profilePage.labels.gender')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user.gender === 'male' ? t('profilePage.labels.male') : t('profilePage.labels.female')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-1.5">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${getRoleColor(user?.role)} text-white shadow-lg scale-[1.02]`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Content Card ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${getRoleColor(user?.role)}`}></div>
          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.username')} *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.email')} *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.phone')}
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder={t('profilePage.labels.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.nationalId')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.national_id}
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                    placeholder={t('profilePage.labels.nationalIdPlaceholder')}
                    maxLength="14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.gender')}
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="">{t('profilePage.labels.selectGender')}</option>
                    <option value="male">{t('profilePage.labels.male')}</option>
                    <option value="female">{t('profilePage.labels.female')}</option>
                  </select>
                </div>

                {user?.role === 'doctor' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('profilePage.labels.specialty')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      placeholder={t('profilePage.labels.specialtyPlaceholder')}
                    />
                  </div>
                )}

                {['pharmacist', 'lab_tech', 'radiology_tech'].includes(user?.role) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('profilePage.labels.facility')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      value={formData.facility_name}
                      onChange={(e) => setFormData({...formData, facility_name: e.target.value})}
                      placeholder={t('profilePage.labels.facilityPlaceholder')}
                    />
                  </div>
                )}

                {['pharmacist', 'lab_tech', 'radiology_tech'].includes(user?.role) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('profilePage.labels.licenseNumber')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      value={formData.license_number}
                      onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                      placeholder={t('profilePage.labels.licensePlaceholder')}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('profilePage.labels.saving')}
                    </>
                  ) : (
                    t('profilePage.actions.saveChanges')
                  )}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.currentPassword')} *
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.newPassword')} *
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    required
                    placeholder="••••••••"
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('profilePage.labels.confirmPassword')} *
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                  {formData.new_password && formData.confirm_password && formData.new_password !== formData.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{t('profilePage.labels.passwordMismatchHint')}</p>
                  )}
                  {formData.new_password && formData.confirm_password && formData.new_password === formData.confirm_password && (
                    <p className="text-green-500 text-xs mt-1">{t('profilePage.labels.passwordMatchHint')}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (formData.new_password && formData.confirm_password && formData.new_password !== formData.confirm_password)}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('profilePage.labels.changing')}
                    </>
                  ) : (
                    t('profilePage.actions.changePasswordBtn')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;