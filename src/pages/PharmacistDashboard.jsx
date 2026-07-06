import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  BeakerIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon, 
  CurrencyDollarIcon, DocumentTextIcon, EyeIcon, XMarkIcon, 
  ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon,
  UserGroupIcon, UserIcon
} from '@heroicons/react/24/outline';

const PharmacistDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceAmount, setPriceAmount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  
  // ===== Search State =====
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, patient, doctor, medication

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pharmacy/prescriptions');
      setPrescriptions(res.data);
    } catch (error) {
      toast.error(t('pharmacistDashboard.messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispense = async (prescription) => {
    if (prescription.total_amount <= 0) {
      toast.error(t('pharmacistDashboard.messages.setPriceFirst'));
      return;
    }
    try {
      await api.put(`/pharmacy/prescriptions/${prescription.id}/dispense`);
      toast.success(t('pharmacistDashboard.messages.dispenseSuccess'));
      fetchData();
    } catch (error) {
      toast.error(t('pharmacistDashboard.messages.dispenseFailed'));
    }
  };

  const handleSetPrice = async () => {
    if (!priceAmount || priceAmount <= 0) {
      toast.error(t('pharmacistDashboard.messages.enterValidPrice'));
      return;
    }
    try {
      await api.put(`/pharmacy/prescriptions/${selectedPrescription.id}/set-price`, { total_amount: priceAmount });
      toast.success(t('pharmacistDashboard.messages.priceSetSuccess'));
      setShowPriceModal(false);
      setSelectedPrescription(null);
      setPriceAmount(0);
      fetchData();
    } catch (error) {
      toast.error(t('pharmacistDashboard.messages.priceSetFailed'));
    }
  };

  const viewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  useEffect(() => { fetchData(); }, []);

  // ===== Search & Filter Functions =====
  const getFilteredPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Search by searchTerm
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const patientMatch = p.patient_name?.toLowerCase().includes(term);
        const doctorMatch = p.doctor_name?.toLowerCase().includes(term);
        const medicationMatch = p.medications?.toLowerCase().includes(term);
        const statusMatch = p.status?.toLowerCase().includes(term);
        const idMatch = p.id?.toString().includes(term);
        
        switch (searchType) {
          case 'patient':
            return patientMatch;
          case 'doctor':
            return doctorMatch;
          case 'medication':
            return medicationMatch;
          default:
            return patientMatch || doctorMatch || medicationMatch || statusMatch || idMatch;
        }
      });
    }
    
    // Filter by status tab
    if (activeSection === 'pending') {
      filtered = filtered.filter(p => p.status === 'pending');
    } else if (activeSection === 'priced') {
      filtered = filtered.filter(p => p.status === 'price_set');
    } else if (activeSection === 'dispensed') {
      filtered = filtered.filter(p => p.status === 'dispensed');
    }
    
    return filtered;
  };

  // ===== Status Helpers =====
  const getStatusBadge = (p) => {
    const badges = {
      'dispensed': { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', text: t('pharmacistDashboard.labels.dispensed') },
      'price_set': { cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: t('pharmacistDashboard.labels.priced') },
      'pending': { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', text: t('pharmacistDashboard.labels.pending') },
    };
    const badge = badges[p.status] || { cls: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', text: p.status };
    return <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${badge.cls}`}>{badge.text}</span>;
  };

  const getStatusBarColor = (status) => ({
    'dispensed': 'from-emerald-400 via-teal-400 to-green-400',
    'price_set': 'from-blue-400 via-indigo-400 to-purple-400',
    'pending': 'from-amber-400 via-orange-400 to-yellow-400',
  })[status] || 'from-gray-300 to-gray-400';

  const getStatusIcon = (status) => ({ 'dispensed': '✅', 'price_set': '💰', 'pending': '⏳' })[status] || '📋';

  const getExpandedBg = (status, isExpanded) => {
    const expanded = { 'dispensed': 'bg-gradient-to-br from-emerald-500 to-teal-600', 'price_set': 'bg-gradient-to-br from-blue-500 to-indigo-600', 'pending': 'bg-gradient-to-br from-amber-500 to-orange-600' };
    const collapsed = { 'dispensed': 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40', 'price_set': 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40', 'pending': 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40' };
    if (isExpanded) return expanded[status] || 'bg-gradient-to-br from-gray-500 to-gray-600';
    return collapsed[status] || 'bg-gradient-to-br from-gray-100 to-gray-100 dark:from-gray-900/40 dark:to-gray-900/40';
  };

  // ===== Tab Stats =====
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const pricedPrescriptions = prescriptions.filter(p => p.status === 'price_set');
  const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');
  const totalSales = dispensedPrescriptions.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const filteredPrescriptions = getFilteredPrescriptions();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 dark:border-green-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 dark:border-green-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('pharmacistDashboard.labels.loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>

          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-4xl">💊</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t('pharmacistDashboard.labels.title')}</h1>
                <p className="text-green-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                  {t('pharmacistDashboard.labels.welcome', { name: user?.username })}
                </p>
              </div>
            </div>
            <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
              <ArrowPathIcon className="w-5 h-5" /> {t('pharmacistDashboard.actions.refresh')}
            </button>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: t('pharmacistDashboard.tabs.all'), count: prescriptions.length, icon: '📋', color: 'from-gray-400/20 to-gray-500/20', tab: 'all' },
              { label: t('pharmacistDashboard.tabs.pending'), count: pendingPrescriptions.length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20', tab: 'pending' },
              { label: t('pharmacistDashboard.tabs.priced'), count: pricedPrescriptions.length, icon: '💰', color: 'from-blue-400/20 to-blue-500/20', tab: 'priced' },
              { label: t('pharmacistDashboard.tabs.dispensed'), count: dispensedPrescriptions.length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20', tab: 'dispensed' },
              { label: t('pharmacistDashboard.labels.revenue'), count: `${totalSales} ${t('pharmacistDashboard.labels.currency')}`, icon: '💵', color: 'from-green-400/20 to-green-500/20', tab: null },
            ].map((stat, idx) => (
              <div key={idx}
                onClick={() => stat.tab && setActiveSection(stat.tab)}
                className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all duration-300 ${stat.tab ? 'cursor-pointer hover:scale-105' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.count}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Search Bar ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('pharmacistDashboard.labels.searchPlaceholder')}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="all">{t('pharmacistDashboard.tabs.all')}</option>
                <option value="patient">{t('pharmacistDashboard.labels.patient')}</option>
                <option value="doctor">{t('pharmacistDashboard.labels.doctor')}</option>
                <option value="medication">{t('pharmacistDashboard.labels.medication')}</option>
              </select>
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); setSearchType('all'); }}
                  className="px-4 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('pharmacistDashboard.messages.searchResults', { count: filteredPrescriptions.length })}
            </div>
          )}
        </div>

        {/* ===== Sales Summary ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
              {t('pharmacistDashboard.labels.salesSummary')}
            </h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('pharmacistDashboard.labels.dispensedPrescriptions'), value: dispensedPrescriptions.length, icon: '✅', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-100 dark:border-emerald-800/30', text: 'text-emerald-600 dark:text-emerald-400' },
              { label: t('pharmacistDashboard.labels.totalRevenue'), value: `${totalSales} ${t('pharmacistDashboard.labels.currency')}`, icon: '💵', bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30', text: 'text-blue-600 dark:text-blue-400' },
              { label: t('pharmacistDashboard.tabs.pending'), value: pendingPrescriptions.length, icon: '⏳', bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-100 dark:border-amber-800/30', text: 'text-amber-600 dark:text-amber-400' },
              { label: t('pharmacistDashboard.labels.averagePrescriptionValue'), value: `${dispensedPrescriptions.length > 0 ? Math.round(totalSales / dispensedPrescriptions.length) : 0} ${t('pharmacistDashboard.labels.currency')}`, icon: '📈', bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30', text: 'text-purple-600 dark:text-purple-400' },
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-r ${item.bg} rounded-xl p-4 border ${item.border} text-center`}>
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Tabs Navigation ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'all', label: t('pharmacistDashboard.tabs.all'), count: filteredPrescriptions.length, icon: '📋' },
              { id: 'pending', label: t('pharmacistDashboard.tabs.pending'), count: pendingPrescriptions.length, icon: '⏳' },
              { id: 'priced', label: t('pharmacistDashboard.tabs.priced'), count: pricedPrescriptions.length, icon: '💰' },
              { id: 'dispensed', label: t('pharmacistDashboard.tabs.dispensed'), count: dispensedPrescriptions.length, icon: '✅' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 scale-[1.02]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeSection === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== Prescriptions List - Expandable ===== */}
        <div className="space-y-3">
          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💊</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {searchTerm ? t('pharmacistDashboard.empty.noSearchResults') : t('pharmacistDashboard.empty.noPrescriptions')}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); setSearchType('all'); }}
                  className="mt-3 text-green-600 dark:text-green-400 hover:underline text-sm"
                >
                  {t('pharmacistDashboard.actions.clearSearch')}
                </button>
              )}
            </div>
          ) : (
            filteredPrescriptions.map(p => {
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                  isExpanded ? 'border-green-300 dark:border-green-600 shadow-xl shadow-green-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'
                }`}>
                  <div className={`h-1.5 bg-gradient-to-r ${getStatusBarColor(p.status)}`}></div>

                  {/* Collapsed Header */}
                  <button onClick={() => toggleExpand(p.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${getExpandedBg(p.status, isExpanded)}`}>
                        <span className="text-2xl">{isExpanded ? '📂' : getStatusIcon(p.status)}</span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{p.patient_name}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full font-medium">
                            {t('pharmacistDashboard.labels.doctorWithName', { name: p.doctor_name })}
                          </span>
                          {getStatusBadge(p)}
                          {p.total_amount > 0 && (
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-medium">
                              {t('pharmacistDashboard.labels.amount', { amount: p.total_amount })}
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                      isExpanded ? 'bg-green-100 dark:bg-green-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-5">

                      {/* Info Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { icon: '👤', label: t('pharmacistDashboard.labels.patient'), value: p.patient_name, bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
                          { icon: '👨‍⚕️', label: t('pharmacistDashboard.labels.doctor'), value: p.doctor_name, bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-green-100 dark:border-green-800/30' },
                          { icon: '📅', label: t('pharmacistDashboard.labels.date'), value: new Date(p.created_at).toLocaleDateString('ar-EG'), bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
                        ].map((card, i) => (
                          <div key={i} className={`bg-gradient-to-r ${card.bg} rounded-xl p-4 border ${card.border} text-center`}>
                            <span className="text-2xl mb-2 block">{card.icon}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{card.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Medications */}
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-3">
                          <span>💊</span> {t('pharmacistDashboard.labels.medications')}
                        </h4>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed">{p.medications}</p>
                        </div>
                      </div>

                      {/* Instructions */}
                      {p.instructions && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                          <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2"><span>📝</span> {t('pharmacistDashboard.labels.doctorInstructions')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{p.instructions}</p>
                        </div>
                      )}

                      {/* Price */}
                      {p.total_amount > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                          <p className="text-sm text-gray-500">{t('pharmacistDashboard.labels.setPrice')}</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{p.total_amount} {t('pharmacistDashboard.labels.currency')}</p>
                        </div>
                      )}

                      {/* Dispensed At */}
                      {p.dispensed_at && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <p className="text-sm text-gray-500">{t('pharmacistDashboard.labels.dispenseDate')}</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(p.dispensed_at).toLocaleString('ar-EG')}</p>
                        </div>
                      )}

                      {/* Status Detail */}
                      <div className={`rounded-xl p-4 border ${
                        p.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' :
                        p.status === 'price_set' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' :
                        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'
                      }`}>
                        <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          <span>{getStatusIcon(p.status)}</span> {t('pharmacistDashboard.labels.prescriptionStatus')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {p.status === 'pending' && t('pharmacistDashboard.labels.statusPendingPrice')}
                          {p.status === 'price_set' && t('pharmacistDashboard.labels.statusPricedWaitingPayment')}
                          {p.status === 'dispensed' && t('pharmacistDashboard.labels.statusDispensed')}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-green-300 dark:border-green-700">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <span className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">⚡</span>
                          {t('pharmacistDashboard.labels.actionsAvailable')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          <button onClick={() => viewPrescriptionDetails(p)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 active:scale-95">
                            <EyeIcon className="w-5 h-5" /> {t('pharmacistDashboard.actions.viewDetails')}
                          </button>

                          {p.status === 'pending' && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPrescription(p); setPriceAmount(p.total_amount || 0); setShowPriceModal(true); }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95">
                              {t('pharmacistDashboard.actions.setPrice')}
                            </button>
                          )}

                          {p.status === 'price_set' && (
                            <button onClick={(e) => { e.stopPropagation(); handleDispense(p); }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95">
                              {t('pharmacistDashboard.actions.dispense')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">🆔</span>
                          <span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">#{p.id}</span>
                        </div>
                        <span className="text-xs text-gray-400">📅 {new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== Details Modal ===== */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-green-500" /> {t('pharmacistDashboard.labels.prescriptionDetails')}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('pharmacistDashboard.labels.patient'), value: selectedPrescription.patient_name },
                  { label: t('pharmacistDashboard.labels.doctor'), value: selectedPrescription.doctor_name },
                  { label: t('pharmacistDashboard.labels.addedDate'), value: new Date(selectedPrescription.created_at).toLocaleString('ar-EG') },
                  { label: t('pharmacistDashboard.labels.status'), value: null, badge: true },
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    {item.badge ? getStatusBadge(selectedPrescription) : <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>}
                  </div>
                ))}
              </div>
              {selectedPrescription.total_amount > 0 && <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center"><p className="text-sm text-gray-500">{t('pharmacistDashboard.labels.price')}</p><p className="text-2xl font-bold text-emerald-600">{selectedPrescription.total_amount} {t('pharmacistDashboard.labels.currency')}</p></div>}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('pharmacistDashboard.labels.medications')}</p><p className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line border border-gray-200 dark:border-gray-700">{selectedPrescription.medications}</p></div>
              {selectedPrescription.instructions && <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30"><p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{t('pharmacistDashboard.labels.doctorInstructions')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedPrescription.instructions}</p></div>}
              {selectedPrescription.dispensed_at && <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30"><p className="text-sm text-gray-500">{t('pharmacistDashboard.labels.dispenseDate')}</p><p className="font-bold text-emerald-600">{new Date(selectedPrescription.dispensed_at).toLocaleString('ar-EG')}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* ===== Price Modal ===== */}
      {showPriceModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('pharmacistDashboard.labels.setPriceTitle')}</h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-sm text-gray-500">{t('pharmacistDashboard.labels.patientLabel')} <span className="font-bold text-gray-800 dark:text-gray-100">{selectedPrescription.patient_name}</span></p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-1">{t('pharmacistDashboard.labels.medications')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedPrescription.medications}</p>
              </div>
              <div><label className={labelClass}>{t('pharmacistDashboard.labels.priceWithCurrency')}</label><input type="number" className={inputClass} placeholder={t('pharmacistDashboard.labels.enterPrice')} value={priceAmount} onChange={e => setPriceAmount(parseFloat(e.target.value))} /></div>
              <button onClick={handleSetPrice} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">{t('pharmacistDashboard.actions.confirmPrice')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PharmacistDashboard;