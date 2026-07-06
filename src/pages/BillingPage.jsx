import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CurrencyDollarIcon, CameraIcon, BeakerIcon, ClipboardDocumentIcon, 
  CreditCardIcon, CheckCircleIcon, XMarkIcon, ClockIcon, EyeIcon,
  ArrowPathIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

const BillingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [bills, setBills] = useState({ radiology: [], lab: [], pharmacy: [] });
  const [paymentHistory, setPaymentHistory] = useState({ radiology: [], lab: [], pharmacy: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [totalAmount, setTotalAmount] = useState(0);
  const [expandedSection, setExpandedSection] = useState({ radiology: true, lab: true, pharmacy: true });

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const radiologyRes = await api.get('/radiology/requests').catch(() => ({ data: [] }));
      const allRadiology = radiologyRes.data || [];
      const labRes = await api.get('/lab/requests').catch(() => ({ data: [] }));
      const allLab = labRes.data || [];
      const pharmacyRes = await api.get('/pharmacy/prescriptions').catch(() => ({ data: [] }));
      const allPharmacy = pharmacyRes.data || [];

      const unpaidRadiology = allRadiology.filter(r => r.patient_id === user?.id && r.status === 'price_set');
      const unpaidLab = allLab.filter(l => l.patient_id === user?.id && l.status === 'price_set');
      const unpaidPharmacy = allPharmacy.filter(p => p.patient_id === user?.id && p.status === 'price_set');
      const paidRadiology = allRadiology.filter(r => r.patient_id === user?.id && (r.status === 'completed' || r.status === 'paid'));
      const paidLab = allLab.filter(l => l.patient_id === user?.id && (l.status === 'completed' || l.status === 'paid'));
      const paidPharmacy = allPharmacy.filter(p => p.patient_id === user?.id && p.status === 'dispensed');

      setBills({ radiology: unpaidRadiology, lab: unpaidLab, pharmacy: unpaidPharmacy });
      setPaymentHistory({ radiology: paidRadiology, lab: paidLab, pharmacy: paidPharmacy });
      const total = [...unpaidRadiology, ...unpaidLab, ...unpaidPharmacy].reduce((sum, item) => sum + (item.total_amount || item.amount || 0), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error(t('billingPage.messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectItem = (item, type) => {
    const itemKey = `${type}_${item.id}`;
    if (selectedItems.includes(itemKey)) {
      setSelectedItems(selectedItems.filter(i => i !== itemKey));
    } else {
      setSelectedItems([...selectedItems, itemKey]);
    }
  };

  const selectAll = () => {
    const allItems = [];
    bills.radiology.forEach(r => allItems.push(`radiology_${r.id}`));
    bills.lab.forEach(l => allItems.push(`lab_${l.id}`));
    bills.pharmacy.forEach(p => allItems.push(`pharmacy_${p.id}`));
    setSelectedItems(allItems);
  };

  const deselectAll = () => setSelectedItems([]);

  const processPayment = () => {
    if (selectedItems.length === 0) { toast.error(t('billingPage.messages.selectBills')); return; }
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    try {
      for (const itemKey of selectedItems) {
        const [type, id] = itemKey.split('_');
        if (type === 'radiology') {
          const bill = bills.radiology.find(r => r.id === parseInt(id));
          if (bill) await api.post('/radiology/payments', { scan_id: bill.id, amount: bill.total_amount, payment_method: paymentMethod, patient_id: user?.id });
        } else if (type === 'lab') {
          const bill = bills.lab.find(l => l.id === parseInt(id));
          if (bill) await api.post('/lab/payments', { test_id: bill.id, amount: bill.amount, payment_method: paymentMethod, patient_id: user?.id });
        } else if (type === 'pharmacy') {
          const bill = bills.pharmacy.find(p => p.id === parseInt(id));
          if (bill) await api.post('/pharmacy/payments', { prescription_id: bill.id, amount: bill.total_amount, payment_method: paymentMethod, patient_id: user?.id });
        }
      }
      toast.success(t('billingPage.messages.paymentSuccess', { count: selectedItems.length, amount: getSelectedTotal() }));
      setShowPaymentModal(false); setSelectedItems([]); fetchBills();
    } catch (error) {
      toast.error(t('billingPage.messages.paymentFailed'));
    }
  };

  const getSelectedTotal = () => {
    let total = 0;
    for (const itemKey of selectedItems) {
      const [type, id] = itemKey.split('_');
      if (type === 'radiology') { const b = bills.radiology.find(r => r.id === parseInt(id)); if (b) total += b.total_amount || 0; }
      else if (type === 'lab') { const b = bills.lab.find(l => l.id === parseInt(id)); if (b) total += b.amount || 0; }
      else if (type === 'pharmacy') { const b = bills.pharmacy.find(p => p.id === parseInt(id)); if (b) total += b.total_amount || 0; }
    }
    return total;
  };

  const viewItemDetails = (item, type) => { setSelectedItemDetails({ ...item, type }); setShowDetailsModal(true); };
  const formatDate = (date) => { if (!date) return '-'; return new Date(date).toLocaleString('ar-EG'); };
  const toggleSection = (section) => setExpandedSection(prev => ({ ...prev, [section]: !prev[section] }));

  useEffect(() => { if (user?.role === 'patient') fetchBills(); }, [user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('billingPage.labels.loading')}</p>
        </div>
      </Layout>
    );
  }

  const totalRadiology = bills.radiology.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalLab = bills.lab.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalPharmacy = bills.pharmacy.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const hasBills = bills.radiology.length > 0 || bills.lab.length > 0 || bills.pharmacy.length > 0;
  const hasHistory = paymentHistory.radiology.length > 0 || paymentHistory.lab.length > 0 || paymentHistory.pharmacy.length > 0;
  const totalPaidRadiology = paymentHistory.radiology.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalPaidLab = paymentHistory.lab.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalPaidPharmacy = paymentHistory.pharmacy.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const grandTotalUnpaid = totalRadiology + totalLab + totalPharmacy;
  const grandTotalPaid = totalPaidRadiology + totalPaidLab + totalPaidPharmacy;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>

          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <CurrencyDollarIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t('billingPage.labels.title')}</h1>
                <p className="text-blue-100 mt-2 text-base">
                  {activeTab === 'unpaid' ? t('billingPage.labels.subtitleUnpaid') : t('billingPage.labels.subtitleHistory')}
                </p>
              </div>
            </div>
              <button onClick={fetchBills} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('billingPage.actions.refresh')}
              </button>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {activeTab === 'unpaid' ? [
              { label: t('billingPage.labels.radiologyUnpaid'), count: bills.radiology.length, amount: totalRadiology, icon: '📷', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('billingPage.labels.labUnpaid'), count: bills.lab.length, amount: totalLab, icon: '🔬', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('billingPage.labels.pharmacyUnpaid'), count: bills.pharmacy.length, amount: totalPharmacy, icon: '💊', color: 'from-purple-400/20 to-purple-500/20' },
              { label: t('billingPage.labels.totalUnpaid'), count: bills.radiology.length + bills.lab.length + bills.pharmacy.length, amount: grandTotalUnpaid, icon: '💰', color: 'from-amber-400/20 to-amber-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <p className="text-white font-bold text-lg">{stat.amount} {t('billingPage.labels.currency')}</p>
                    <p className="text-white/70 text-xs">{stat.label} ({stat.count})</p>
                  </div>
                </div>
              </div>
            )) : [
              { label: t('billingPage.labels.radiologyPaid'), count: paymentHistory.radiology.length, amount: totalPaidRadiology, icon: '📷', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('billingPage.labels.labPaid'), count: paymentHistory.lab.length, amount: totalPaidLab, icon: '🔬', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('billingPage.labels.pharmacyPaid'), count: paymentHistory.pharmacy.length, amount: totalPaidPharmacy, icon: '💊', color: 'from-purple-400/20 to-purple-500/20' },
              { label: t('billingPage.labels.totalPaid'), count: paymentHistory.radiology.length + paymentHistory.lab.length + paymentHistory.pharmacy.length, amount: grandTotalPaid, icon: '✅', color: 'from-green-400/20 to-green-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <p className="text-white font-bold text-lg">{stat.amount} {t('billingPage.labels.currency')}</p>
                    <p className="text-white/70 text-xs">{stat.label} ({stat.count})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2">
          <div className="flex gap-1">
            {[
              { id: 'unpaid', label: t('billingPage.tabs.unpaid'), count: bills.radiology.length + bills.lab.length + bills.pharmacy.length, icon: '💰' },
              { id: 'history', label: t('billingPage.tabs.history'), count: paymentHistory.radiology.length + paymentHistory.lab.length + paymentHistory.pharmacy.length, icon: '📜' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== Unpaid Tab ===== */}
        {activeTab === 'unpaid' && (
          <>
            {/* Action Bar */}
            {hasBills && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-3">
                  <button onClick={selectAll} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95">
                    {t('billingPage.actions.selectAll')}
                  </button>
                  <button onClick={deselectAll} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95">
                    {t('billingPage.actions.deselectAll')}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {selectedItems.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('billingPage.labels.selectedAmount')}</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{getSelectedTotal()} {t('billingPage.labels.currency')}</p>
                    </div>
                  )}
                  <button onClick={processPayment} disabled={selectedItems.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100">
                    <CreditCardIcon className="w-5 h-5" />
                    {t('billingPage.actions.pay', { count: selectedItems.length })}
                  </button>
                </div>
              </div>
            )}

            {/* Radiology Bills */}
            {bills.radiology.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => toggleSection('radiology')}
                  className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-100 dark:border-gray-700 hover:from-blue-100 dark:hover:from-blue-900/30 transition-all">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                      <CameraIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {t('billingPage.labels.radiology')}
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-xl font-bold">{bills.radiology.length} {t('billingPage.labels.invoice')}</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{totalRadiology} {t('billingPage.labels.currency')}</span>
                  </h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedSection.radiology ? 'rotate-180' : ''}`} />
                </button>
                {expandedSection.radiology && (
                  <div className="p-4 space-y-3">
                    {bills.radiology.map(scan => (
                      <div key={scan.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${selectedItems.includes(`radiology_${scan.id}`) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800'}`}>
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={selectedItems.includes(`radiology_${scan.id}`)} onChange={() => toggleSelectItem(scan, 'radiology')}
                            className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">📷</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{scan.scan_type} - {scan.body_part}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('billingPage.labels.requestFromDoctor', { doctor: scan.doctor_name })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{scan.total_amount} {t('billingPage.labels.currency')}</p>
                          </div>
                          <button onClick={() => viewItemDetails(scan, 'radiology')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lab Bills */}
            {bills.lab.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => toggleSection('lab')}
                  className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-100 dark:border-gray-700 hover:from-emerald-100 dark:hover:from-emerald-900/30 transition-all">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t('billingPage.labels.lab')}
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">{bills.lab.length} {t('billingPage.labels.invoice')}</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalLab} {t('billingPage.labels.currency')}</span>
                  </h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedSection.lab ? 'rotate-180' : ''}`} />
                </button>
                {expandedSection.lab && (
                  <div className="p-4 space-y-3">
                    {bills.lab.map(test => (
                      <div key={test.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${selectedItems.includes(`lab_${test.id}`) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-md' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800'}`}>
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={selectedItems.includes(`lab_${test.id}`)} onChange={() => toggleSelectItem(test, 'lab')}
                            className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">🔬</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{test.test_name} - {test.test_type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('billingPage.labels.requestFromDoctor', { doctor: test.doctor_name })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{test.amount} {t('billingPage.labels.currency')}</p>
                          <button onClick={() => viewItemDetails(test, 'lab')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-colors">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pharmacy Bills */}
            {bills.pharmacy.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => toggleSection('pharmacy')}
                  className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-700 hover:from-purple-100 dark:hover:from-purple-900/30 transition-all">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                      <ClipboardDocumentIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    {t('billingPage.labels.pharmacy')}
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-xl font-bold">{bills.pharmacy.length} {t('billingPage.labels.invoice')}</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{totalPharmacy} {t('billingPage.labels.currency')}</span>
                  </h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedSection.pharmacy ? 'rotate-180' : ''}`} />
                </button>
                {expandedSection.pharmacy && (
                  <div className="p-4 space-y-3">
                    {bills.pharmacy.map(prescription => (
                      <div key={prescription.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${selectedItems.includes(`pharmacy_${prescription.id}`) ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 shadow-md' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800'}`}>
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={selectedItems.includes(`pharmacy_${prescription.id}`)} onChange={() => toggleSelectItem(prescription, 'pharmacy')}
                            className="w-5 h-5 rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">💊</span>
                          </div>
                          <div>
                              <p className="font-bold text-gray-800 dark:text-gray-100">{t('billingPage.labels.prescriptionFromDoctor', { doctor: prescription.doctor_name })}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{prescription.medications.substring(0, 50)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{prescription.total_amount} {t('billingPage.labels.currency')}</p>
                          <button onClick={() => viewItemDetails(prescription, 'pharmacy')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-colors">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Bills */}
            {!hasBills && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{t('billingPage.empty.noUnpaid')}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t('billingPage.empty.allPaid')}</p>
                <button onClick={() => setActiveTab('history')}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                  {t('billingPage.actions.viewHistory')}
                </button>
              </div>
            )}
          </>
        )}

        {/* ===== History Tab ===== */}
        {activeTab === 'history' && (
          <>
            {!hasHistory ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <ClockIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">{t('billingPage.empty.noHistory')}</h3>
                <p className="text-gray-500 dark:text-gray-500">{t('billingPage.empty.noPayments')}</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Paid Radiology */}
                {paymentHistory.radiology.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                          <CameraIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {t('billingPage.labels.radiologyPaid')}
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">
                          {paymentHistory.radiology.length} {t('billingPage.labels.transaction')}
                        </span>
                      </h3>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{totalPaidRadiology} {t('billingPage.labels.currency')}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {paymentHistory.radiology.map(scan => (
                        <div key={scan.id} className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 dark:text-gray-100">{scan.scan_type} - {scan.body_part}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('billingPage.labels.doctorPrefix')}{scan.doctor_name}</p>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('billingPage.labels.paid')}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(scan.completed_at || scan.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{scan.total_amount} {t('billingPage.labels.currency')}</p>
                            <button onClick={() => viewItemDetails(scan, 'radiology')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Lab */}
                {paymentHistory.lab.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                          <BeakerIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {t('billingPage.labels.labPaid')}
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">{paymentHistory.lab.length} {t('billingPage.labels.transaction')}</span>
                      </h3>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalPaidLab} {t('billingPage.labels.currency')}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {paymentHistory.lab.map(test => (
                        <div key={test.id} className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 dark:text-gray-100">{test.test_name} - {test.test_type}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('billingPage.labels.doctorPrefix')}{test.doctor_name}</p>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('billingPage.labels.paid')}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(test.completed_at || test.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{test.amount} {t('billingPage.labels.currency')}</p>
                            <button onClick={() => viewItemDetails(test, 'lab')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Pharmacy */}
                {paymentHistory.pharmacy.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                          <ClipboardDocumentIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        {t('billingPage.labels.pharmacyPaid')}
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">{paymentHistory.pharmacy.length} {t('billingPage.labels.transaction')}</span>
                      </h3>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{totalPaidPharmacy} {t('billingPage.labels.currency')}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {paymentHistory.pharmacy.map(prescription => (
                        <div key={prescription.id} className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{t('billingPage.labels.prescriptionFromDoctor', { doctor: prescription.doctor_name })}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{prescription.medications.substring(0, 50)}...</p>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('billingPage.labels.paidAndDispensed')}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(prescription.dispensed_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{prescription.total_amount} {t('billingPage.labels.currency')}</p>
                            <button onClick={() => viewItemDetails(prescription, 'pharmacy')} className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Details Modal ===== */}
      {showDetailsModal && selectedItemDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {selectedItemDetails.type === 'radiology' && <CameraIcon className="w-5 h-5 text-blue-500" />}
                {selectedItemDetails.type === 'lab' && <BeakerIcon className="w-5 h-5 text-emerald-500" />}
                {selectedItemDetails.type === 'pharmacy' && <ClipboardDocumentIcon className="w-5 h-5 text-purple-500" />}
                {t('billingPage.labels.details')} {selectedItemDetails.type === 'radiology' ? t('billingPage.labels.radiologyDetailsTitle') : selectedItemDetails.type === 'lab' ? t('billingPage.labels.labDetailsTitle') : t('billingPage.labels.pharmacyDetailsTitle')}
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedItemDetails.type === 'radiology' && (
                <>
                  {[{ label: t('billingPage.labels.scanType'), value: selectedItemDetails.scan_type }, { label: t('billingPage.labels.bodyPart'), value: selectedItemDetails.body_part }, { label: t('billingPage.labels.doctor'), value: selectedItemDetails.doctor_name }].map((item, i) => (
                    <div key={i} className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                  {selectedItemDetails.description && <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500 mb-1">{t('billingPage.labels.doctorNotes')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedItemDetails.description}</p></div>}
                  {selectedItemDetails.result && <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30"><p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">{t('billingPage.labels.radiologyReport')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedItemDetails.result}</p></div>}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center"><p className="text-xs text-gray-500">{t('billingPage.labels.amount')}</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedItemDetails.total_amount} {t('billingPage.labels.currency')}</p></div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500">{t('billingPage.labels.paymentDate')}</p><p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{formatDate(selectedItemDetails.completed_at || selectedItemDetails.updated_at)}</p></div>
                </>
              )}
              {selectedItemDetails.type === 'lab' && (
                <>
                  {[{ label: t('billingPage.labels.testType'), value: selectedItemDetails.test_type }, { label: t('billingPage.labels.testName'), value: selectedItemDetails.test_name }, { label: t('billingPage.labels.doctor'), value: selectedItemDetails.doctor_name }].map((item, i) => (
                    <div key={i} className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                  {selectedItemDetails.description && <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500 mb-1">{t('billingPage.labels.notes')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedItemDetails.description}</p></div>}
                  {selectedItemDetails.result && <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30"><p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{t('billingPage.labels.labResult')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedItemDetails.result}</p></div>}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center"><p className="text-xs text-gray-500">{t('billingPage.labels.amount')}</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedItemDetails.amount} {t('billingPage.labels.currency')}</p></div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500">{t('billingPage.labels.paymentDate')}</p><p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{formatDate(selectedItemDetails.completed_at || selectedItemDetails.updated_at)}</p></div>
                </>
              )}
              {selectedItemDetails.type === 'pharmacy' && (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30"><p className="text-xs text-gray-500">{t('billingPage.labels.doctor')}</p><p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{selectedItemDetails.doctor_name}</p></div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500 mb-2 font-bold">{t('billingPage.labels.medications')}</p><p className="bg-white dark:bg-gray-800 p-3 rounded-xl whitespace-pre-line text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{selectedItemDetails.medications}</p></div>
                  {selectedItemDetails.instructions && <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30"><p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{t('billingPage.labels.doctorInstructions')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedItemDetails.instructions}</p></div>}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center"><p className="text-xs text-gray-500">{t('billingPage.labels.amount')}</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedItemDetails.total_amount} {t('billingPage.labels.currency')}</p></div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500">{t('billingPage.labels.dispenseDate')}</p><p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{formatDate(selectedItemDetails.dispensed_at)}</p></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Payment Modal ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('billingPage.actions.confirmPayment')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('billingPage.labels.billCount')}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{selectedItems.length}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('billingPage.labels.totalAmount')}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{getSelectedTotal()} {t('billingPage.labels.currency')}</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('billingPage.labels.paymentMethod')}</label>
                <select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">{t('billingPage.labels.cash')}</option>
                  <option value="card">{t('billingPage.labels.card')}</option>
                  <option value="wallet">{t('billingPage.labels.wallet')}</option>
                </select>
              </div>
              <button onClick={confirmPayment} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CreditCardIcon className="w-5 h-5" /> {t('billingPage.actions.confirmPayment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BillingPage;