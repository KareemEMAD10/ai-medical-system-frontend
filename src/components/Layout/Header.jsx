import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import logo from '../../assets/logo/Ai_EHR.png';

const Header = ({ toggleSidebar, onNotificationClick, unreadCount }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user?.profile_picture) {
      // لو الصورة Base64
      if (user.profile_picture.startsWith('data:image')) {
        setProfileImage(user.profile_picture);
      } 
      // لو الصورة مسار
      else if (user.profile_picture.startsWith('http')) {
        setProfileImage(user.profile_picture);
      } 
      // لو الصورة مسار نسبي
      else {
        setProfileImage(`http://localhost:8000${user.profile_picture}`);
      }
    } else {
      setProfileImage(null);
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 dark:border-dark-200/70 bg-white/85 dark:bg-dark-100/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Menu Button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2.5 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 hover:bg-gray-50 dark:hover:bg-dark-200 text-gray-600 dark:text-gray-300 shadow-sm transition-all duration-200 active:scale-95"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Logo and Page Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/20 border border-primary-100 dark:border-primary-800/30 shadow-sm flex items-center justify-center flex-shrink-0">
            <img 
              src={logo} 
              alt="AI EHR Logo" 
              className="w-7 h-7 object-contain"
              style={{ background: 'transparent' }}
            />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
              AI EHR SYSTEM
            </p>
            <h1 className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100 truncate leading-tight">
              {document.title}
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2.5 rounded-xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 hover:bg-gray-50 dark:hover:bg-dark-200 shadow-sm transition-all duration-200 active:scale-95"
          >
            <BellIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-200 rounded-2xl px-2.5 py-1.5 shadow-sm">
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden"
              style={{
                background: profileImage 
                  ? 'transparent' 
                  : 'linear-gradient(135deg, #10b981, #0ea5e9)'
              }}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={user?.username}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    console.error('❌ Failed to load image');
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-100 rounded-full"></span>
            </div>

            <div className="hidden md:block leading-tight">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('header.active_user')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;