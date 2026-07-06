import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden" dir="rtl">

      {/* ===== Background Blobs ===== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/20 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* ===== Card ===== */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-700 p-10 max-w-md w-full text-center">

        {/* Top Accent */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-8 -mx-10 -mt-10 rounded-t-3xl"></div>

        {/* Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
          <span className="text-5xl">🔍</span>
        </div>

        {/* 404 */}
        <div className="relative mb-3">
          <p className="text-8xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 text-8xl font-black text-indigo-100 dark:text-indigo-900/30 leading-none select-none blur-sm -z-10">
            404
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t('errors.not_found_title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {t('errors.not_found_message')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 active:scale-95">
            <HomeIcon className="w-4 h-4" />
            {t('errors.not_found_home')}
          </Link>
          <button onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-600 shadow-sm">
            <ArrowRightIcon className="w-4 h-4" />
            {t('errors.not_found_back')}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          🏥 AI EHR System
        </p>
      </div>
    </div>
  );
};

export default NotFound;