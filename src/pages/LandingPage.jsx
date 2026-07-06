// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon, UserIcon, UserPlusIcon, ShieldCheckIcon,
  BeakerIcon, CameraIcon, DocumentTextIcon,
  CurrencyDollarIcon, ChatBubbleLeftRightIcon,
  CpuChipIcon, SparklesIcon, ArrowPathIcon,
  CheckCircleIcon, ClockIcon, HeartIcon,
  UsersIcon, UserGroupIcon, CalendarIcon,
  BuildingOfficeIcon, GlobeAltIcon,
  ChevronRightIcon, StarIcon, AcademicCapIcon,
  PhoneIcon, EnvelopeIcon, MapPinIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo/Ai_EHR.png';

// ====== صور توضيحية (من assets) ======
// لو مش عندك الصور، استخدم URLs مؤقتة
const images = {
  dashboard: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
  patient: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop',
  doctor: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop',
  pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
  lab: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=600&h=400&fit=crop',
  radiology: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
  team: 'https://images.unsplash.com/photo-1522077820084-1b56d0f6d2b6?w=600&h=400&fit=crop'
};

const LandingPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    doctors: 0,
    patients: 0,
    records: 0,
    appointments: 0
  });
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    // جلب إحصائيات سريعة
    const fetchStats = async () => {
      try {
        // لو في API، جيب الإحصائيات
        // api.get('/public/stats').then(res => setStats(res.data));
        // حالياً نستخدم بيانات تجريبية
        setStats({
          users: 1250,
          doctors: 180,
          patients: 980,
          records: 3200,
          appointments: 450
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // ====== لو المستخدم مسجل دخول، حوله للـ Dashboard ======
  useEffect(() => {
    if (user) {
      const role = user.role;
      const dashboardMap = {
        patient: '/',
        doctor: '/doctor-dashboard',
        admin: '/admin',
        pharmacist: '/pharmacist-dashboard',
        lab_tech: '/lab-tech-dashboard',
        radiology_tech: '/radiology-tech-dashboard',
        finance_manager: '/finance-manager'
      };
      navigate(dashboardMap[role] || '/');
    }
  }, [user, navigate]);

  // ====== Scroll to section ======
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <img src={logo} alt="AI EHR" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {t('app.name')}
                </span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5 font-medium tracking-wider">
                  {t('app.tagline')}
                </p>
              </div>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button onClick={() => scrollToSection('home')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t('landing.home')}
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t('landing.features')}
              </button>
              <button onClick={() => scrollToSection('stats')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t('landing.stats')}
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t('landing.testimonials')}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t('landing.contact')}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-semibold"
              >
                {isRTL ? t('auth.language_switch_en') : t('auth.language_switch_ar')}
              </button>
              
              <Link to="/login" 
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {t('landing.login')}
              </Link>
              <Link to="/register" 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                <UserPlusIcon className="w-4 h-4" />
                {t('landing.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                <SparklesIcon className="w-4 h-4" />
                {t('landing.hero_badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {t('landing.hero_title')}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  {t('landing.hero_title_highlight')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-lg leading-relaxed">
                {t('landing.hero_description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" 
                  className="px-8 py-4 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold shadow-xl shadow-black/20 transition-all flex items-center gap-2 hover:scale-105">
                  <UserPlusIcon className="w-5 h-5" />
                  {t('landing.hero_cta_primary')}
                </Link>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 rounded-2xl font-semibold transition-all flex items-center gap-2">
                  {t('landing.hero_cta_secondary')}
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-8 mt-8 text-sm text-indigo-100">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
                  <span>{t('landing.hero_feature_secure')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
                  <span>{t('landing.hero_feature_doctor')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
                  <span>{t('landing.hero_feature_standard')}</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <img 
                  src={images.dashboard} 
                  alt="AI EHR Dashboard" 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 24 24" fill="none" stroke="%23fff" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3Cpath d="M3 9h18M9 21V9"/%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <p className="text-white text-sm font-medium">✨ {t('landing.hero_card_title')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-semibold mb-4">
              ⚡ {t('landing.feature_badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('landing.feature_heading')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
              {t('landing.feature_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <UsersIcon className="w-6 h-6" />,
                title: t('landingPage.featurePatients'),
                desc: t('landingPage.featurePatientsDesc'),
                color: 'from-blue-500 to-cyan-500',
                img: images.patient
              },
              {
                icon: <UserGroupIcon className="w-6 h-6" />,
                title: t('landingPage.featureDoctors'),
                desc: t('landingPage.featureDoctorsDesc'),
                color: 'from-emerald-500 to-teal-500',
                img: images.doctor
              },
              {
                icon: <BeakerIcon className="w-6 h-6" />,
                title: t('landingPage.featureLabRad'),
                desc: t('landingPage.featureLabRadDesc'),
                color: 'from-purple-500 to-pink-500',
                img: images.lab
              },
              {
                icon: <DocumentTextIcon className="w-6 h-6" />,
                title: t('landingPage.featurePharmacy'),
                desc: t('landingPage.featurePharmacyDesc'),
                color: 'from-orange-500 to-amber-500',
                img: images.pharmacy
              },
              {
                icon: <CpuChipIcon className="w-6 h-6" />,
                title: t('landingPage.featureAI'),
                desc: t('landingPage.featureAIDesc'),
                color: 'from-indigo-500 to-purple-500',
                img: images.ai
              },
              {
                icon: <CurrencyDollarIcon className="w-6 h-6" />,
                title: t('landingPage.featureFinance'),
                desc: t('landingPage.featureFinanceDesc'),
                color: 'from-green-500 to-emerald-500',
                img: images.dashboard
              }
            ].map((feature, index) => (
              <div key={index} 
                className="group bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                <div className="h-40 overflow-hidden relative">
                  <img 
                    src={feature.img} 
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3Cpath d="M3 9h18M9 21V9"/%3E%3C/svg%3E`;
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                </div>
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section id="stats" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-semibold mb-4">
              📊 {t('landing.stats_title')}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('landing.stats_subtitle')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: t('landing.stats_users'), value: stats.users, icon: '👤', color: 'from-blue-500 to-blue-600' },
              { label: t('landing.stats_doctors'), value: stats.doctors, icon: '👨‍⚕️', color: 'from-emerald-500 to-emerald-600' },
              { label: t('landing.stats_patients'), value: stats.patients, icon: '🏥', color: 'from-amber-500 to-amber-600' },
              { label: t('landing.stats_records'), value: stats.records, icon: '📋', color: 'from-purple-500 to-purple-600' },
              { label: t('landing.stats_appointments'), value: stats.appointments, icon: '📅', color: 'from-rose-500 to-rose-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <span className="text-3xl block mb-2">{stat.icon}</span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold mb-4">
              💬 {t('landing.testimonial_badge')}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('landing.testimonial_heading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: t('landingPage.testimonial1Name'),
                role: t('landingPage.testimonial1Role'),
                quote: t('landingPage.testimonial1Quote'),
                rating: 5,
                avatar: '👨‍⚕️'
              },
              {
                name: t('landingPage.testimonial2Name'),
                role: t('landingPage.testimonial2Role'),
                quote: t('landingPage.testimonial2Quote'),
                rating: 5,
                avatar: '👩'
              },
              {
                name: t('landingPage.testimonial3Name'),
                role: t('landingPage.testimonial3Role'),
                quote: t('landingPage.testimonial3Quote'),
                rating: 5,
                avatar: '👨‍⚕️'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-1 mt-4 text-amber-400">
                  {[...Array(5)].map((_, j) => (
                    <StarIcon key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('landing.contact_heading')}
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            {t('landing.contact_subtitle')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" 
              className="px-8 py-4 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold shadow-xl shadow-black/20 transition-all flex items-center gap-2 hover:scale-105">
              <UserPlusIcon className="w-5 h-5" />
              {t('landing.register')}
            </Link>
            <Link to="/login" 
              className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 rounded-2xl font-semibold transition-all flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              {t('landing.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <img src={logo} alt="AI EHR" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-lg font-bold text-white">{t('app.name')}</span>
              </div>
              <p className="text-sm leading-relaxed">
                {t('landing.hero_description')}
              </p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors">📱</a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">🐦</a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">📺</a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">💼</a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.features')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">{t('landing.login')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.register')}</Link></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">{t('landing.features')}</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">{t('landing.testimonials')}</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.contact')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">{t('landingPage.footerPrivacy')}</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">{t('landingPage.footerTerms')}</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">{t('landingPage.footerHelpCenter')}</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">{t('landingPage.footerFAQ')}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.contact')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>info@aiehr.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  <span>+20 100 000 0000</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{t('landingPage.footerAddress')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>{t('landingPage.footerCopyright', { year: new Date().getFullYear() })}</p>
            <p className="text-xs text-gray-600 mt-1">{t('landingPage.footerMadeWith')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;