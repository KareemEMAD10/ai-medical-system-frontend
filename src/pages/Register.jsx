import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { 
  SunIcon, MoonIcon, UserIcon, EnvelopeIcon, LockClosedIcon, 
  BuildingOfficeIcon, AcademicCapIcon, EyeIcon, EyeSlashIcon,
  IdentificationIcon, PhoneIcon, CameraIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import patientPhoto    from '../assets/images/patient_register_photo.png';
import doctorPhoto     from '../assets/images/doctor_register_photo.png';
import pharmacistPhoto from '../assets/images/pharmacist_register_photo.png';
import labPhoto        from '../assets/images/lab_register_photo.png';
import radiologyPhoto  from '../assets/images/radiology_register_photo.png';

const rolePhotos = {
  patient: patientPhoto, doctor: doctorPhoto, pharmacist: pharmacistPhoto,
  lab_tech: labPhoto, radiology_tech: radiologyPhoto,
};

const S = {
  patient:        { btn: 'bg-blue-600',   sh: 'shadow-blue-600/25',   fc: 'focus:ring-blue-500',   ib: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-500',   gf: 'from-blue-600',   gt: 'to-indigo-600' },
  doctor:         { btn: 'bg-teal-600',   sh: 'shadow-teal-600/25',   fc: 'focus:ring-teal-500',   ib: 'bg-teal-50 dark:bg-teal-900/20',   ic: 'text-teal-500',   gf: 'from-teal-600',   gt: 'to-cyan-600' },
  pharmacist:     { btn: 'bg-emerald-600',sh: 'shadow-emerald-600/25',fc: 'focus:ring-emerald-500',ib: 'bg-emerald-50 dark:bg-emerald-900/20',ic: 'text-emerald-500',gf: 'from-emerald-600',gt: 'to-green-600' },
  lab_tech:       { btn: 'bg-purple-600', sh: 'shadow-purple-600/25', fc: 'focus:ring-purple-500', ib: 'bg-purple-50 dark:bg-purple-900/20', ic: 'text-purple-500', gf: 'from-purple-600', gt: 'to-violet-600' },
  radiology_tech: { btn: 'bg-amber-600',  sh: 'shadow-amber-600/25',  fc: 'focus:ring-amber-500',  ib: 'bg-amber-50 dark:bg-amber-900/20',  ic: 'text-amber-500',  gf: 'from-amber-600',  gt: 'to-orange-600' },
};

const doctorSpecialtyKeys = [
  'internal_medicine','cardiology','pediatrics','general_surgery',
  'obstetrics_gynecology','orthopedics','dermatology','ophthalmology','dentistry',
  'neurology','psychiatry','urology','ent',
  'gastroenterology','endocrinology','rheumatology','oncology','emergency',
  'intensive_care','anesthesiology','diagnostic_radiology','nuclear_medicine',
  'physical_medicine','family_medicine','geriatrics'
];

const Register = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirm_password: '',
    role: 'patient', gender: '', specialty: '', facility_name: '', license_number: '',
    // ====== الحقول الجديدة ======
    national_id: '',
    phone: '',
    profile_picture: null
    // ===========================
  });

  const currentPhoto = rolePhotos[formData.role] || patientPhoto;
  const s = S[formData.role] || S.patient;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) { toast.error(t('errors.passwords_not_match')); return; }
    setIsLoading(true);
    try {
      // تحويل الصورة إلى Base64 أو URL
      const formDataToSend = { ...formData };
      if (formData.profile_picture) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.profile_picture);
        });
        formDataToSend.profile_picture = base64;
      }
      await register(formDataToSend);
      toast.success(t('auth.register_success') + ' - ' + t('auth.pending_verification'));
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errors.server_error'));
    } finally { setIsLoading(false); }
  };

  const roles = [
    { value: 'patient',        label: t('register.roles.patient'),        icon: '🏥', rF: false, rL: false, rS: false },
    { value: 'doctor',         label: t('register.roles.doctor'),         icon: '👨‍⚕️', rF: false, rL: false, rS: true },
    { value: 'pharmacist',     label: t('register.roles.pharmacist'),     icon: '💊', rF: true,  rL: true,  rS: false },
    { value: 'lab_tech',       label: t('register.roles.lab_tech'),       icon: '🔬', rF: true,  rL: true,  rS: false },
    { value: 'radiology_tech', label: t('register.roles.radiology_tech'), icon: '📷', rF: true,  rL: true,  rS: false },
  ];

  const sel = roles.find(r => r.value === formData.role);
  const pwMatch = formData.password && formData.confirm_password && formData.password === formData.confirm_password;
  const pwMismatch = formData.password && formData.confirm_password && formData.password !== formData.confirm_password;

  const ic = `w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-xs shadow-sm ${s.fc}`;
  const iconPos = isRTL ? 'right-2.5' : 'left-2.5';

  return (
    <div className={`min-h-screen flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ===== Image Side ===== */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden">
        <img key={formData.role} src={currentPhoto} alt={sel?.label}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-slate-900/5" />
        <div className="relative z-10 flex flex-col justify-between p-8 text-white h-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md shadow-black/15">
              <span className="text-base">{sel?.icon}</span>
            </div>
            <div>
              <p className="font-bold text-xs">{t('app.name')}</p>
              <p className="text-white/40 text-[9px]">{t('auth.new_account')}</p>
            </div>
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">
              {t('auth.account_type')}
            </p>
            <h2 className="text-xl font-bold mb-2">{sel?.label}</h2>
            <p className="text-white/50 text-[11px] leading-relaxed mb-4 max-w-xs">
              {t('auth.join_us')}
            </p>
            <div className="flex gap-1">
              {roles.map(r => (
                <div key={r.value}
                  className={`h-1 rounded-full transition-all duration-500 ${formData.role === r.value ? 'w-6 bg-white shadow-sm shadow-white/30' : 'w-1 bg-white/25'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Form Side ===== */}
      <div className="w-full lg:w-[60%] flex flex-col bg-gray-50 dark:bg-gray-950">

        {/* Top Bar */}
        <div className="flex justify-between items-center p-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1"
              aria-label={t('common.back_to_home')}
            >
              <ArrowLeftIcon className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="text-[10px] font-medium hidden sm:inline">{t('common.back_to_home').replace('← ', '')}</span>
            </button>
            <div className={`w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
              <span className="text-xs">{sel?.icon}</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white text-[10px]">AI EHR</span>
          </div>
          <div className={`flex gap-1 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <button onClick={toggleLanguage}
              className="px-2 py-1 rounded text-[10px] font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700">
              {isRTL ? t('auth.language_switch_en') : t('auth.language_switch_ar')}
            </button>
            <button onClick={toggleTheme}
              className="p-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700">
              {theme === 'light' ? <MoonIcon className="w-3 h-3" /> : <SunIcon className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 lg:px-12 pb-4">
          <div className="max-w-md mx-auto">

            {/* Header */}
            <div className="mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gf} ${s.gt} flex items-center justify-center mb-2 shadow-md ${s.sh} transition-all duration-500`}>
                <span className="text-lg">{sel?.icon}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('auth.register')} ✨
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-[11px]">
                {t('auth.create_account')}
              </p>
            </div>

            {/* Role Selector */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 mb-3 shadow-md shadow-gray-200/50 dark:shadow-black/15 border border-gray-100 dark:border-gray-800">
              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                {t('auth.account_type')}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {roles.map(role => {
                  const isSelected = formData.role === role.value;
                  const rs = S[role.value];
                  return (
                    <button key={role.value} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: role.value, specialty: '', facility_name: '', license_number: '' }))}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] ${
                        isSelected
                          ? `${rs.btn} border-transparent text-white shadow-md ${rs.sh}`
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-sm">{role.icon}</span>
                      <span className="text-[8px] font-semibold leading-tight text-center">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg shadow-gray-200/50 dark:shadow-black/15 border border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Username + Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('profile.username')} *
                    </label>
                    <div className="relative">
                      <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center transition-colors duration-300`}>
                        <UserIcon className={`w-3 h-3 ${s.ic}`} />
                      </div>
                      <input type="text" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className={ic} placeholder={t('profile.username')} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('auth.email')} *
                    </label>
                    <div className="relative">
                      <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center transition-colors duration-300`}>
                        <EnvelopeIcon className={`w-3 h-3 ${s.ic}`} />
                      </div>
                      <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={ic} placeholder="email@example.com" required />
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('auth.password')} *
                    </label>
                    <div className="relative">
                      <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
                        <LockClosedIcon className={`w-3 h-3 ${s.ic}`} />
                      </div>
                      <input type={showPassword ? 'text' : 'password'} value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={`${ic} ${isRTL ? '!pl-8' : '!pr-8'}`} placeholder="••••••" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all`}>
                        {showPassword ? <EyeSlashIcon className="w-2.5 h-2.5" /> : <EyeIcon className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('profile.confirm_password')} *
                    </label>
                    <div className="relative">
                      <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 ${pwMatch ? 'bg-green-50 dark:bg-green-900/20' : pwMismatch ? 'bg-red-50 dark:bg-red-900/20' : s.ib}`}>
                        <LockClosedIcon className={`w-3 h-3 ${pwMatch ? 'text-green-500' : pwMismatch ? 'text-red-400' : s.ic}`} />
                      </div>
                      <input type={showPassword ? 'text' : 'password'} value={formData.confirm_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-xs shadow-sm ${pwMismatch ? 'border-red-300 dark:border-red-700 focus:ring-red-400' : pwMatch ? 'border-green-300 dark:border-green-700 focus:ring-green-400' : `border-gray-200 dark:border-gray-700 ${s.fc}`}`}
                        placeholder="••••••" required />
                    </div>
                    {pwMismatch && <p className="text-red-500 text-[9px] mt-0.5">⚠️ {t('profile.password_mismatch')}</p>}
                    {pwMatch && <p className="text-green-500 text-[9px] mt-0.5">✓ {t('profile.password_match')}</p>}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('profile.gender')}
                  </label>
                  <select value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm ${s.fc}`}>
                    <option value="">{t('common.select')}</option>
                    <option value="male">{t('gender.male')}</option>
                    <option value="female">{t('gender.female')}</option>
                  </select>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('profile.national_id')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
                      <IdentificationIcon className={`w-3 h-3 ${s.ic}`} />
                    </div>
                    <input 
                      type="text" 
                      value={formData.national_id} 
                      onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                      className={ic} 
                      placeholder={t('profile.national_id_placeholder')}
                      maxLength="14"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('profile.phone')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
                      <PhoneIcon className={`w-3 h-3 ${s.ic}`} />
                    </div>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={ic} 
                      placeholder={t('profile.phone_input_placeholder')}
                    />
                  </div>
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('profile.profile_picture')}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-full ${s.ib} flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700`}>
                      {formData.profile_picture ? (
                        <img 
                          src={URL.createObjectURL(formData.profile_picture)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CameraIcon className={`w-6 h-6 ${s.ic}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className={`cursor-pointer inline-block px-3 py-1.5 rounded-lg text-xs font-medium ${s.btn} text-white hover:opacity-90 transition-all`}>
                        <CameraIcon className="w-3 h-3 inline ml-1" />
                        {t('profile.choose_photo')}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData(prev => ({ ...prev, profile_picture: e.target.files[0] }));
                            }
                          }}
                        />
                      </label>
                      {formData.profile_picture && (
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profile_picture: null }))}
                          className="text-red-500 text-[9px] hover:underline mr-2"
                        >
                          {t('profile.remove_photo')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specialty */}
                {sel?.rS && (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('doctors.specialty')} *</label>
                    <div className="relative">
                      <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
                        <AcademicCapIcon className={`w-3 h-3 ${s.ic}`} />
                      </div>
                      <select value={formData.specialty} onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                        className={ic} required>
                        <option value="">{t('common.select_specialty')}</option>
                        {doctorSpecialtyKeys.map(spec => <option key={spec} value={spec}>{t(`register.specialties.${spec}`)}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Facility + License */}
                {sel?.rF && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('profile.facility_name')} *</label>
                      <div className="relative">
                        <div className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-6 h-6 rounded ${s.ib} flex items-center justify-center`}>
                          <BuildingOfficeIcon className={`w-3 h-3 ${s.ic}`} />
                        </div>
                        <input type="text" value={formData.facility_name} onChange={(e) => setFormData(prev => ({ ...prev, facility_name: e.target.value }))}
                          className={ic} placeholder={t('profile.facility_placeholder')} required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('profile.license_number')} *</label>
                      <input type="text" value={formData.license_number} onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm ${s.fc}`}
                        placeholder={t('profile.license_placeholder')} required />
                    </div>
                  </div>
                )}

                {/* Notice */}
                <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 rounded-lg p-2">
                  <p className="text-[9px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>{t('profile.review_notice')}</span>
                  </p>
                </div>

                {/* Submit */}
                <button type="submit" disabled={isLoading || pwMismatch}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${s.gf} ${s.gt} text-white font-semibold text-xs transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg ${s.sh} hover:shadow-xl hover:opacity-95`}>
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('profile.registering')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">{sel?.icon}</span>
                      <span>{t('auth.register')}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Login Link */}
            <div className="mt-3 text-center bg-white dark:bg-gray-900 rounded-lg p-2.5 shadow-sm shadow-gray-200/40 dark:shadow-black/10 border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t('auth.have_account')}{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 text-center flex-shrink-0">
          <p className="text-[9px] text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} AI EHR System</p>
        </div>
      </div>
    </div>
  );
};

export default Register;