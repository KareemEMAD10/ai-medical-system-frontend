import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  HomeIcon, UsersIcon, UserGroupIcon, BeakerIcon, CameraIcon,
  CpuChipIcon, CurrencyDollarIcon, ShieldCheckIcon, UserCircleIcon,
  ArrowRightOnRectangleIcon, SunIcon, MoonIcon, LanguageIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import logo from '../../assets/logo/Ai_EHR.png';

// ===== Section grouping =====
const navSections = [
  {
    label: 'sidebar.sections.dashboard',
    items: [
      { name: 'dashboard.title', path: '/patient-dashboard', icon: <HomeIcon className="w-5 h-5" />, roles: ['patient'] },
      { name: 'dashboard.title', path: '/doctor-dashboard', icon: <HomeIcon className="w-5 h-5" />, roles: ['doctor'] },
      { name: 'dashboard.title', path: '/admin', icon: <HomeIcon className="w-5 h-5" />, roles: ['admin'] },
      { name: 'dashboard.title', path: '/pharmacist-dashboard', icon: <HomeIcon className="w-5 h-5" />, roles: ['pharmacist'] },
      { name: 'dashboard.title', path: '/lab-tech-dashboard', icon: <HomeIcon className="w-5 h-5" />, roles: ['lab_tech'] },
      { name: 'dashboard.title', path: '/radiology-tech-dashboard', icon: <HomeIcon className="w-5 h-5" />, roles: ['radiology_tech'] },
    ]
  },
  {
    label: 'sidebar.sections.healthcare',
    items: [
      { name: 'patients.title', path: '/patients', icon: <UsersIcon className="w-5 h-5" />, roles: ['doctor'] },
      { name: 'pharmacy.title', path: '/pharmacy', icon: <BeakerIcon className="w-5 h-5" />, roles: ['doctor', 'pharmacist', 'patient'] },
      { name: 'lab.title', path: '/lab', icon: <BeakerIcon className="w-5 h-5" />, roles: ['doctor', 'lab_tech', 'patient'] },
      { name: 'radiology.title', path: '/radiology', icon: <CameraIcon className="w-5 h-5" />, roles: ['doctor', 'radiology_tech', 'patient'] },
    ]
  },
  {
    label: 'sidebar.sections.tools',
    items: [
      { name: 'nav.ai_reviews', path: '/ai-reviews', icon: <CpuChipIcon className="w-5 h-5" />, roles: ['doctor', 'patient'] },
      // { name: 'nav.financial', path: '/financial', icon: <CurrencyDollarIcon className="w-5 h-5" />, roles: ['doctor', 'pharmacist', 'lab_tech', 'radiology_tech'] },
      { name: 'nav.billing', path: '/billing', icon: <CurrencyDollarIcon className="w-5 h-5" />, roles: ['patient'], badge: true },
      { name: 'nav.admin', path: '/admin', icon: <ShieldCheckIcon className="w-5 h-5" />, roles: ['admin'] },
      { name: 'nav.doctors', path: '/doctors', icon: <UserGroupIcon className="w-5 h-5" />, roles: ['admin'] },
    ]
  },
  {
    label: 'sidebar.sections.account',
    items: [
      { name: 'nav.profile', path: '/profile', icon: <UserCircleIcon className="w-5 h-5" />, roles: ['admin','doctor','patient','pharmacist','lab_tech','radiology_tech'] },
    ]
  },
];

const roleLabels = {
  admin: 'roles.admin',
  doctor: 'roles.doctor',
  patient: 'roles.patient',
  pharmacist: 'roles.pharmacist',
  lab_tech: 'roles.lab_tech',
  radiology_tech: 'roles.radiology_tech',
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [unpaidBillsCount, setUnpaidBillsCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fetchUnpaidBillsCount = async () => {
    if (user?.role !== 'patient') return;
    try {
      const [radiologyRes, labRes, pharmacyRes] = await Promise.all([
        api.get('/radiology/requests').catch(() => ({ data: [] })),
        api.get('/lab/requests').catch(() => ({ data: [] })),
        api.get('/pharmacy/prescriptions').catch(() => ({ data: [] }))
      ]);
      const count = [
        ...(radiologyRes.data || []),
        ...(labRes.data || []),
        ...(pharmacyRes.data || [])
      ].filter(r => r.patient_id === user.id && r.status === 'price_set' && r.payment_status !== 'paid').length;
      setUnpaidBillsCount(count);
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
    }
  };

  useEffect(() => {
    fetchUnpaidBillsCount();
    const interval = setInterval(fetchUnpaidBillsCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ====== تحميل الصورة الشخصية ======
  useEffect(() => {
    if (user?.profile_picture) {
      // لو الصورة Base64
      if (user.profile_picture.startsWith('data:image')) {
        setProfileImage(user.profile_picture);
      } 
      // لو الصورة مسار كامل
      else if (user.profile_picture.startsWith('http')) {
        setProfileImage(user.profile_picture);
      } 
      // لو الصورة مسار نسبي
      else {
        setProfileImage(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_picture}`);
      }
    } else {
      setProfileImage(null);
      setImageError(false);
    }
  }, [user]);
  // =================================

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Overlay للموبايل */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-[2px]"
          style={{ background: theme === 'dark' ? 'rgba(2,6,23,0.65)' : 'rgba(15,23,42,0.28)' }}
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full w-72 z-50
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(180deg, #0b1d33 0%, #12395b 52%, #0b4a43 100%)'
            : 'linear-gradient(180deg, #f8fbff 0%, #edf5ff 48%, #eefcf7 100%)',
          boxShadow: theme === 'dark'
            ? '-8px 0 40px rgba(0,0,0,0.35)'
            : '-8px 0 35px rgba(15,23,42,0.12)',
          borderLeft: theme === 'dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(15,23,42,0.08)',
        }}
      >
        {/* Watermark طبي خفي */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span
            style={{
              position: 'absolute',
              bottom: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '180px',
              opacity: theme === 'dark' ? 0.045 : 0.05,
              color: theme === 'dark' ? 'white' : '#0f766e',
              userSelect: 'none',
            }}
          >
            ⚕
          </span>
        </div>

        {/* Glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))'
              : 'linear-gradient(180deg, rgba(16,185,129,0.10), rgba(16,185,129,0))'
          }}
        />

        {/* ===== Logo ===== */}
        <div
          className="relative flex-shrink-0 flex flex-col items-center py-6 px-4"
          style={{
            borderBottom: theme === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(15,23,42,0.08)'
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)',
              border: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.22)'
                : '1px solid rgba(15,23,42,0.08)',
              boxShadow: theme === 'dark'
                ? '0 10px 24px rgba(0,0,0,0.22)'
                : '0 10px 24px rgba(15,23,42,0.10)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <img src={logo} alt="AI EHR" className="w-11 h-11 object-contain" />
          </div>

          <h1
            className="font-bold text-base tracking-wide"
            style={{ color: theme === 'dark' ? 'white' : '#0f172a' }}
          >
            AI EHR System
          </h1>

          <p
            className="text-xs mt-1"
            style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.45)' }}
          >
            {t('app.version')}
          </p>
        </div>

        {/* ===== User Info ===== */}
        {user && (
          <div
            className="relative flex-shrink-0 px-4 py-4"
            style={{
              borderBottom: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(15,23,42,0.08)'
            }}
          >
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
                border: theme === 'dark'
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(15,23,42,0.08)',
                boxShadow: theme === 'dark'
                  ? '0 8px 18px rgba(0,0,0,0.14)'
                  : '0 8px 18px rgba(15,23,42,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* ====== Avatar with Profile Picture ====== */}
              <div
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 overflow-hidden"
                style={{
                  background: profileImage && !imageError 
                    ? 'transparent' 
                    : (theme === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.10))'
                      : 'linear-gradient(135deg, #10b981, #0ea5e9)'),
                  border: theme === 'dark'
                    ? '1.5px solid rgba(255,255,255,0.22)'
                    : '1.5px solid rgba(255,255,255,0.45)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
                }}
              >
                {profileImage && !imageError ? (
                  <img 
                    src={profileImage} 
                    alt={user?.username}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={() => {
                      console.error('❌ Failed to load profile image in sidebar');
                      setImageError(true);
                    }}
                  />
                ) : (
                  <span style={{ color: 'white', fontSize: '16px' }}>
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                )}
                <span
                  className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full"
                  style={{
                    background: '#22c55e',
                    border: theme === 'dark' ? '2px solid #12395b' : '2px solid white'
                  }}
                />
              </div>
              {/* ===================================== */}

              <div className="min-w-0 flex-1">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: theme === 'dark' ? 'white' : '#0f172a' }}
                >
                  {user.username}
                </p>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full inline-block mt-1 font-medium"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(16,185,129,0.12)',
                    color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#047857',
                    border: theme === 'dark'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(16,185,129,0.18)'
                  }}
                >
                  {t(roleLabels[user.role]) || user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===== Navigation ===== */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {navSections.map((section) => {
            const sectionItems = section.items.filter(item =>
              user && item.roles.includes(user.role)
            );
            if (sectionItems.length === 0) return null;

            return (
              <div
                key={section.label}
                className="mb-4 rounded-2xl p-2"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
                  border: theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(15,23,42,0.05)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Section Label */}
                <p
                  className="text-[11px] font-bold px-3 mb-2 tracking-[0.18em] uppercase"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.38)' }}
                >
                  {t(section.label)}
                </p>

                {sectionItems.map((item, idx) => (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) => `
                      group flex items-center gap-3 px-3 py-3 rounded-2xl mb-1
                      text-sm transition-all duration-200
                      ${isActive
                        ? 'font-semibold'
                        : ''
                      }
                      ${theme === 'dark'
                        ? isActive
                          ? 'text-white'
                          : 'text-white/70 hover:text-white'
                        : isActive
                          ? 'text-slate-900'
                          : 'text-slate-700 hover:text-slate-900'
                      }
                    `}
                    style={({ isActive }) => isActive ? {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10))'
                        : 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(14,165,233,0.10))',
                      border: theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.18)'
                        : '1px solid rgba(16,185,129,0.18)',
                      boxShadow: theme === 'dark'
                        ? '0 6px 16px rgba(0,0,0,0.16)'
                        : '0 6px 16px rgba(15,23,42,0.08)',
                      backdropFilter: 'blur(8px)',
                    } : {
                      background: 'transparent',
                    }}
                  >
                    <span
                      className="transition-all duration-200 group-hover:scale-110"
                      style={{
                        color: theme === 'dark'
                          ? 'rgba(255,255,255,0.9)'
                          : '#0f766e'
                      }}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1">{t(item.name)}</span>

                    {item.badge && unpaidBillsCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                        {unpaidBillsCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ===== Bottom Buttons ===== */}
        <div
          className="flex-shrink-0 p-3 grid grid-cols-3 gap-2"
          style={{
            borderTop: theme === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(15,23,42,0.08)'
          }}
        >
          {/* Language */}
          <button
            onClick={toggleLanguage}
            className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
              border: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid rgba(15,23,42,0.08)',
              color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#0f172a',
              boxShadow: theme === 'dark'
                ? '0 6px 16px rgba(0,0,0,0.12)'
                : '0 6px 16px rgba(15,23,42,0.06)',
            }}
          >
            <LanguageIcon className="w-5 h-5" />
            <span>{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
              border: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid rgba(15,23,42,0.08)',
              color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#0f172a',
              boxShadow: theme === 'dark'
                ? '0 6px 16px rgba(0,0,0,0.12)'
                : '0 6px 16px rgba(15,23,42,0.06)',
            }}
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            <span>{theme === 'light' ? t('theme.dark') : t('theme.light')}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: theme === 'dark' ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              boxShadow: theme === 'dark'
                ? '0 6px 16px rgba(0,0,0,0.12)'
                : '0 6px 16px rgba(15,23,42,0.06)',
            }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;