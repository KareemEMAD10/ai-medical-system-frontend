import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import { 
  CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon,
  ClockIcon, CheckCircleIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/helpers';

const FinancialPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setEarnings([
        { id: 1, service_type: 'consultation', amount: 150, net_earning: 135, created_at: new Date().toISOString() },
        { id: 2, service_type: 'prescription', amount: 50, net_earning: 45, created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
      setTotalEarnings(15420);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleWithdraw = () => {
    if (withdrawAmount && parseFloat(withdrawAmount) <= totalEarnings) {
      console.log('Withdraw:', withdrawAmount);
      setWithdrawAmount('');
    }
  };

  const getServiceTypeLabel = (type) => {
    const labels = {
      consultation: t('financialPage.serviceTypeConsultation'),
      prescription: t('financialPage.serviceTypePrescription'),
      test: t('financialPage.serviceTypeTest'),
      scan: t('financialPage.serviceTypeScan'),
    };
    return labels[type] || type;
  };

  const getServiceIcon = (type) => {
    const icons = {
      consultation: '🩺',
      prescription: '💊',
      test: '🔬',
      scan: '📷',
    };
    return icons[type] || '💰';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 dark:border-emerald-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('financialPage.loading')}</p>
        </div>
      </Layout>
    );
  }

  const totalTransactions = earnings.length;
  const avgEarning = totalTransactions > 0
    ? earnings.reduce((s, e) => s + e.net_earning, 0) / totalTransactions
    : 0;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>

          <div className="relative flex justify-between items-start flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <CurrencyDollarIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                  {t('financial.title')}
                </h1>
                <p className="text-emerald-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                  {t('financialPage.subtitle')}
                </p>
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg min-w-[200px]">
              <p className="text-emerald-100 text-sm font-medium">{t('financial.total_earnings')}</p>
              <p className="text-4xl font-bold text-white mt-1">{formatCurrency(totalEarnings)}</p>
              <p className="text-emerald-200 text-xs mt-2 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" /> {t('financialPage.last_updated')}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: t('financialPage.stat_total_earnings'), value: formatCurrency(totalEarnings), icon: '💰', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('financialPage.stat_transactions_count'), value: totalTransactions, icon: '📋', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('financialPage.stat_avg_earning'), value: formatCurrency(avgEarning), icon: '📈', color: 'from-purple-400/20 to-purple-500/20' },
              { label: t('financialPage.stat_available_balance'), value: formatCurrency(totalEarnings), icon: '🏦', color: 'from-amber-400/20 to-amber-500/20' },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all duration-300`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Withdraw Section ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ArrowUpIcon className="w-5 h-5 text-emerald-500" />
              {t('financial.withdraw')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('financialPage.available_balance')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalEarnings)}</span>
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{t('financialPage.currency')}</span>
                <input
                  type="number"
                  placeholder={t('financial.withdraw_amount')}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 pr-14 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) > totalEarnings}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 flex items-center gap-2"
              >
                <ArrowUpIcon className="w-4 h-4" />
                {t('financial.withdraw')}
              </button>
            </div>

            {withdrawAmount && (
              <div className={`mt-4 p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                parseFloat(withdrawAmount) > totalEarnings
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
              }`}>
                {parseFloat(withdrawAmount) > totalEarnings
                  ? t('financialPage.exceeds_balance')
                  : t('financialPage.withdraw_confirm', { amount: formatCurrency(parseFloat(withdrawAmount)) })}
              </div>
            )}
          </div>
        </div>

        {/* ===== Earnings List ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              {t('financialPage.earnings_history')}
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl font-bold">
              {t('financialPage.transactions_count', { count: earnings.length })}
            </span>
          </div>

          <div className="p-5">
            {earnings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CurrencyDollarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('financialPage.no_earnings')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('financialPage.no_earnings_subtitle')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.map((earning) => (
                  <div key={earning.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <span className="text-xl">{getServiceIcon(earning.service_type)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">
                          {getServiceTypeLabel(earning.service_type)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {new Date(earning.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg flex items-center gap-1 justify-end">
                        <ArrowDownIcon className="w-4 h-4" />
                        {formatCurrency(earning.net_earning)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t('financialPage.total_amount')}: {formatCurrency(earning.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialPage;