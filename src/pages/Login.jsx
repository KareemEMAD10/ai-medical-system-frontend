import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { SunIcon, MoonIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import loginPhoto from '../assets/images/login_photo.png';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':          return '/admin';
      case 'doctor':         return '/doctor-dashboard';
      case 'patient':        return '/patient-dashboard';
      case 'pharmacist':     return '/pharmacist-dashboard';
      case 'lab_tech':       return '/lab-tech-dashboard';
      case 'radiology_tech': return '/radiology-tech-dashboard';
      case 'finance_manager': return '/finance-manager';
      default:               return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login(email, password);
      toast.success(t('auth.login_success'));
      navigate(getDashboardPath(response.role));
    } catch (error) {
      toast.error(t('errors.invalid_email') || t('login.login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isRTL ? 'flex-row' : 'flex-row-reverse'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ===== Image Side ===== */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img src={loginPhoto} alt="Medical" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-slate-900/10" />

        <div className="relative z-10 flex flex-col justify-between p-10 text-white h-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg shadow-black/20">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide">{t('app.name')}</h2>
              <p className="text-white/50 text-[10px]">{t('app.version')}</p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold leading-snug mb-2">
              {isRTL ? t('auth.hero_title_ar') : t('auth.hero_title_en')}
            </h1>
            <p className="text-white/60 text-xs leading-relaxed mb-5 max-w-sm">
              {t('app.tagline')}
            </p>
            <div className="flex gap-2">
              {[
                { icon: '🤖', text: t('auth.ai_badge') },
                { icon: '🔒', text: t('auth.security_badge') },
                { icon: '📱', text: t('auth.responsive_badge') },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10 shadow-md shadow-black/10">
                  <span className="text-xs">{f.icon}</span>
                  <span className="text-[10px] font-medium text-white/75">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Form Side ===== */}
      <div className="w-full lg:w-[55%] flex flex-col bg-gray-50 dark:bg-gray-950">

        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5"
              aria-label={t('common.back_to_home')}
            >
              <ArrowLeftIcon className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="text-xs font-medium hidden sm:inline">{t('common.back_to_home').replace('← ', '')}</span>
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-sm">🏥</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-white text-xs">AI EHR</span>
            </Link>
          </div>
          <div className={`flex gap-1.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <button onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700">
              {isRTL ? t('auth.language_switch_en') : t('auth.language_switch_ar')}
            </button>
            <button onClick={toggleTheme}
              className="p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700">
              {theme === 'light' ? <MoonIcon className="w-3.5 h-3.5" /> : <SunIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Center Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-20">
          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="mb-7">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25">
                <span className="text-xl">🏥</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('auth.welcome_back')} 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                {t('auth.welcome_back_subtitle')}
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg shadow-gray-200/60 dark:shadow-black/20 border border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center`}>
                      <EnvelopeIcon className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className={`w-full ${isRTL ? 'pr-11 pl-3' : 'pl-11 pr-3'} py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-xs shadow-sm`}
                      placeholder={t('auth.email_placeholder')} required />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <div className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center`}>
                      <LockClosedIcon className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-xs shadow-sm`}
                      placeholder={t('auth.password_placeholder')} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm`}>
                      {showPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/35">
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('common.loading_data')}</span>
                    </>
                  ) : t('auth.login')}
                </button>
              </form>
            </div>

            {/* Register Link */}
            <div className="mt-4 text-center bg-white dark:bg-gray-900 rounded-xl p-3 shadow-md shadow-gray-200/40 dark:shadow-black/10 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('auth.no_account')}{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} AI EHR System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;