import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  PlusIcon, XMarkIcon, SparklesIcon, EyeIcon, TrashIcon, 
  CreditCardIcon, UserCircleIcon, ChevronDownIcon, ArrowPathIcon,
  ChevronRightIcon, ShoppingCartIcon, CheckCircleIcon, ClockIcon,
  MagnifyingGlassIcon, BeakerIcon, HomeIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const PharmacyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [patients, setPatients] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPatientPrescriptionsModal, setShowPatientPrescriptionsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [priceAmount, setPriceAmount] = useState(0);
  const [selectedMedication, setSelectedMedication] = useState('');
  const [customMedication, setCustomMedication] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expandedId, setExpandedId] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  
  // ===== Stock Management State =====
  const [stockItems, setStockItems] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStockRequestsModal, setShowStockRequestsModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockNotes, setStockNotes] = useState('');
  
  // ===== Inventory Search State =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [inventoryView, setInventoryView] = useState('all'); // all, low, category
  const [expandedInventoryId, setExpandedInventoryId] = useState(null);

  const [requestData, setRequestData] = useState({
    patient_id: '',
    pharmacist_id: '',
    medications: '',
    instructions: '',
    total_amount: 0
  });

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const toggleInventoryExpand = (id) => setExpandedInventoryId(expandedInventoryId === id ? null : id);

  const getStatusBadge = (prescription) => {
    if (prescription.status === 'dispensed') {
      return <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">{t('pharmacyPage.labels.dispensed')}</span>;
    }
    if (prescription.status === 'price_set' && prescription.payment_status === 'paid') {
      return <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl font-bold">{t('pharmacyPage.labels.paidWaitingDispense')}</span>;
    }
    if (prescription.status === 'price_set' && prescription.payment_status !== 'paid') {
      return <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-xl font-bold">{t('pharmacyPage.labels.priced')}</span>;
    }
    if (prescription.status === 'pending') {
      return <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl font-bold">{t('pharmacyPage.labels.pendingStatus')}</span>;
    }
    return <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-xl font-bold border border-gray-200 dark:border-gray-600">{prescription.status}</span>;
  };

  const getStatusBarColor = (p) => {
    if (p.status === 'dispensed') return 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400';
    if (p.status === 'price_set' && p.payment_status === 'paid') return 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400';
    if (p.status === 'price_set') return 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400';
    return 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400';
  };

  const getStatusIcon = (p) => {
    if (p.status === 'dispensed') return '✅';
    if (p.status === 'price_set' && p.payment_status === 'paid') return '💳';
    if (p.status === 'price_set') return '💰';
    return '⏳';
  };

  const getAvatarBg = (p, isExpanded) => {
    if (isExpanded) {
      if (p.status === 'dispensed') return 'bg-gradient-to-br from-emerald-500 to-teal-600';
      if (p.status === 'price_set') return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      return 'bg-gradient-to-br from-amber-500 to-orange-600';
    }
    if (p.status === 'dispensed') return 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40';
    if (p.status === 'price_set') return 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40';
    return 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40';
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [presRes, medsRes, pharmRes, catsRes, stockRes] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/medications'),
        api.get('/users/by-role/pharmacist'),
        api.get('/pharmacy/medications/categories'),
        api.get('/stock/items')
      ]);
      
      // ===== جيب طلبات المخزون للصيدلي فقط =====
      let stockRequestsData = [];
      if (user?.role === 'pharmacist') {
        try {
          const stockReqRes = await api.get('/stock/requests/my');
          stockRequestsData = stockReqRes.data || [];
        } catch (error) {
          console.log('❌ فشل جلب طلبات المخزون:', error.message);
          // متظهرش error للمستخدم عشان مش مهمة للدكتور
        }
      }
      
      // ===== جيب المرضى حسب الدور =====
      let patientsData = [];
      if (user?.role === 'doctor') {
        try {
          const patientsRes = await api.get('/doctors/my-patients');
          patientsData = patientsRes.data || [];
        } catch (error) {
          console.log('❌ فشل جلب مرضى الدكتور:', error.message);
          patientsData = [];
        }
      } else if (user?.role === 'pharmacist') {
        try {
          const patientsRes = await api.get('/patients');
          patientsData = patientsRes.data || [];
        } catch (error) {
          console.log('❌ فشل جلب المرضى:', error.message);
          patientsData = [];
        }
      } else {
        try {
          const patientsRes = await api.get('/patients');
          patientsData = (patientsRes.data || []).filter(p => p.role === 'patient');
        } catch (error) {
          console.log('❌ فشل جلب المرضى:', error.message);
          patientsData = [];
        }
      }
      
      // ===== فلترة الروشتات حسب الدور =====
      let filteredPrescriptions = presRes.data || [];
      if (user?.role === 'patient') {
        filteredPrescriptions = filteredPrescriptions.filter(p => p.patient_id === user.id);
      } else if (user?.role === 'doctor') {
        filteredPrescriptions = filteredPrescriptions.filter(p => p.doctor_id === user.id);
      }
      
      setPrescriptions(filteredPrescriptions);
      setMedications(medsRes.data || []);
      setPatients(patientsData);
      setPharmacists(pharmRes.data || []);
      setCategories(catsRes.data || []);
      setStockItems(stockRes.data || []);
      setStockRequests(stockRequestsData);
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error(t('pharmacyPage.messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientPrescriptions = (patient) => {
    const filteredPrescriptions = prescriptions.filter(p => p.patient_id === patient.id);
    setSelectedPatient(patient);
    setPatientPrescriptions(filteredPrescriptions);
    setShowPatientPrescriptionsModal(true);
    if (filteredPrescriptions.length === 0) {
      toast.info(t('pharmacyPage.messages.noPrescriptionsForPatient', { name: patient.username }));
    }
  };

  const getAISuggestion = async () => {
    const meds = requestData.medications;
    if (!meds) { toast.error(t('pharmacyPage.messages.selectMedicationFirst')); return; }
    setShowAIModal(true);
    try {
      const response = await api.post('/ai/analyze-prescription', { medications: meds, instructions: requestData.instructions });
      setAiSuggestion(response.data.suggestion || response.data.analysis || t('pharmacyPage.messages.analyzeSuccess'));
    } catch (error) {
      setAiSuggestion(t('pharmacyPage.messages.aiAnalysisFallback', { meds }));
    }
  };

  const addMedication = () => {
    if (selectedMedication) {
      const med = medications.find(m => m.id === parseInt(selectedMedication));
      if (med) {
        const currentMeds = requestData.medications;
        const newMeds = currentMeds ? `${currentMeds}\n• ${med.name} - ${med.price} ${t('pharmacyPage.labels.currency')}` : `• ${med.name} - ${med.price} ${t('pharmacyPage.labels.currency')}`;
        setRequestData({...requestData, medications: newMeds});
        setSelectedMedication('');
      }
    } else if (customMedication) {
      const currentMeds = requestData.medications;
      const newMeds = currentMeds ? `${currentMeds}\n• ${customMedication}` : `• ${customMedication}`;
      setRequestData({...requestData, medications: newMeds});
      setCustomMedication('');
    } else { toast.error(t('pharmacyPage.messages.selectOrTypeDrug')); }
  };

  const removeMedicationLine = (indexToRemove) => {
    const lines = requestData.medications.split('\n');
    setRequestData({...requestData, medications: lines.filter((_, i) => i !== indexToRemove).join('\n')});
  };

  const clearAllMedications = () => { setRequestData({...requestData, medications: ''}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.patient_id || !requestData.pharmacist_id || !requestData.medications) { toast.error(t('pharmacyPage.messages.completeAllData')); return; }
    try {
      await api.post('/pharmacy/prescriptions', { 
        patient_id: parseInt(requestData.patient_id), 
        pharmacist_id: parseInt(requestData.pharmacist_id), 
        medications: requestData.medications, 
        instructions: requestData.instructions, 
        total_amount: 0 
      });
      toast.success(t('pharmacyPage.messages.sentToPharmacist'));
      setShowModal(false);
      setRequestData({ patient_id: '', pharmacist_id: '', medications: '', instructions: '', total_amount: 0 });
      setSelectedMedication(''); 
      setCustomMedication(''); 
      fetchData();
    } catch (error) { 
      toast.error(error.response?.data?.detail || t('pharmacyPage.messages.sendFailed')); 
    }
  };

  const handleSetPrice = async () => {
    if (!priceAmount || priceAmount <= 0) { toast.error(t('pharmacyPage.messages.enterValidPrice')); return; }
    try {
      await api.put(`/pharmacy/prescriptions/${selectedPrescription.id}/set-price`, { total_amount: priceAmount });
      toast.success(t('pharmacyPage.messages.priceSetSuccess'));
      setShowPriceModal(false); 
      setSelectedPrescription(null); 
      setPriceAmount(0); 
      fetchData();
    } catch (error) { 
      toast.error(t('pharmacyPage.messages.priceSetFailed')); 
    }
  };

  const handlePayment = (prescription) => { 
    setSelectedPrescription(prescription); 
    setPriceAmount(prescription.total_amount); 
    setPaymentMethod('cash'); 
    setShowPaymentModal(true); 
  };

  const processPayment = async () => {
    if (!selectedPrescription) return;
    try {
      await api.post('/pharmacy/payments', { 
        prescription_id: selectedPrescription.id, 
        amount: priceAmount, 
        payment_method: paymentMethod, 
        patient_id: user?.id 
      });
      toast.success(t('pharmacyPage.messages.paymentSuccess', { amount: priceAmount }));
      setShowPaymentModal(false); 
      setSelectedPrescription(null); 
      fetchData();
    } catch (error) { 
      toast.error(error.response?.data?.detail || t('pharmacyPage.messages.paymentFailed')); 
    }
  };

  const handleDispense = async (prescription) => {
    if (prescription.total_amount <= 0) { 
      toast.error(t('pharmacyPage.messages.setPriceFirst')); 
      return; 
    }
    try { 
      await api.put(`/pharmacy/prescriptions/${prescription.id}/dispense`); 
      toast.success(t('pharmacyPage.messages.dispenseSuccess')); 
      fetchData(); 
    } catch (error) { 
      toast.error(t('pharmacyPage.messages.dispenseFailed')); 
    }
  };

  const viewPrescriptionDetails = (prescription) => { 
    setSelectedPrescription(prescription); 
    setShowDetailsModal(true); 
  };

  // ===== Stock Management Functions =====
  const handleRequestStock = async () => {
    if (!selectedStockItem) {
      toast.error(t('pharmacyPage.messages.selectItem'));
      return;
    }
    if (stockQuantity <= 0) {
      toast.error(t('pharmacyPage.messages.enterValidQuantity'));
      return;
    }
    try {
      await api.post('/stock/requests', {
        item_id: selectedStockItem.id,
        quantity: stockQuantity,
        notes: stockNotes
      });
      toast.success(t('pharmacyPage.messages.stockRequestSent'));
      setShowStockModal(false);
      setSelectedStockItem(null);
      setStockQuantity(1);
      setStockNotes('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('pharmacyPage.messages.stockRequestFailed'));
    }
  };

  // ===== Inventory Filter Functions =====
  const getFilteredInventory = () => {
    let filtered = [...stockItems];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategoryFilter) {
      filtered = filtered.filter(item => item.category === selectedCategoryFilter);
    }
    
    // View filter
    if (inventoryView === 'low') {
      filtered = filtered.filter(item => item.quantity <= item.min_quantity);
    }
    
    return filtered;
  };

  const getUniqueCategories = () => {
    const cats = new Set();
    stockItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  };

  const totalItems = stockItems.length;
  const totalQuantity = stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockItems = stockItems.filter(item => item.quantity <= item.min_quantity).length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);

  const filteredInventory = getFilteredInventory();
  const uniqueCategories = getUniqueCategories();

  useEffect(() => { 
    fetchData(); 
  }, [user]);

  if (isLoading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-900"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 dark:border-emerald-400 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('pharmacyPage.labels.loading')}</p>
      </div>
    </Layout>
  );

  const filteredMedications = selectedCategory ? medications.filter(m => m.category === selectedCategory) : medications;
  const medicationsList = requestData.medications ? requestData.medications.split('\n').filter(m => m.trim()) : [];

  // ===== Tab Filters =====
  const pendingPres = prescriptions.filter(p => p.status === 'pending');
  const pricedPres = prescriptions.filter(p => p.status === 'price_set');
  const dispensedPres = prescriptions.filter(p => p.status === 'dispensed');
  const totalAmount = dispensedPres.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const getTabPrescriptions = () => {
    switch (activeSection) {
      case 'pending': return pendingPres;
      case 'priced': return pricedPres;
      case 'dispensed': return dispensedPres;
      default: return prescriptions;
    }
  };

  const currentPrescriptions = getTabPrescriptions();

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">

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
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t('pharmacyPage.labels.pharmacy')}</h1>
                <p className="text-green-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                  {user?.role === 'doctor' && t('pharmacyPage.labels.doctorAddPrescriptions')}
                  {user?.role === 'pharmacist' && t('pharmacyPage.labels.pharmacistManage')}
                  {user?.role === 'patient' && t('pharmacyPage.labels.patientView')}
                  {user?.role === 'admin' && t('pharmacyPage.labels.adminManage')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user?.role === 'doctor' && (
                <button onClick={() => setShowModal(true)} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                  <PlusIcon className="w-5 h-5" /> {t('pharmacyPage.actions.newPrescription')}
                </button>
              )}
              {user?.role === 'pharmacist' && (
                <button onClick={() => setShowStockModal(true)} className="bg-amber-500/30 backdrop-blur-sm hover:bg-amber-500/40 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                  <ShoppingCartIcon className="w-5 h-5" /> {t('pharmacyPage.actions.requestStock')}
                </button>
              )}
              <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('pharmacyPage.actions.refresh')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-6 gap-4 mt-8">
            {[
              { label: t('pharmacyPage.tabs.all'), count: prescriptions.length, icon: '📋', color: 'from-gray-400/20 to-gray-500/20', tab: 'all' },
              { label: t('pharmacyPage.tabs.pending'), count: pendingPres.length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20', tab: 'pending' },
              { label: t('pharmacyPage.tabs.priced'), count: pricedPres.length, icon: '💰', color: 'from-blue-400/20 to-blue-500/20', tab: 'priced' },
              { label: t('pharmacyPage.tabs.dispensed'), count: dispensedPres.length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20', tab: 'dispensed' },
              { label: t('pharmacyPage.labels.revenue'), count: `${totalAmount} ${t('pharmacyPage.labels.currency')}`, icon: '💵', color: 'from-green-400/20 to-green-500/20', tab: null },
              { label: t('pharmacyPage.labels.stockRequestsCount'), count: stockRequests.filter(r => r.status === 'pending').length, icon: '📦', color: 'from-amber-400/20 to-amber-500/20', tab: null },
            ].map((stat, idx) => (
              <div key={idx} onClick={() => stat.tab && setActiveSection(stat.tab)}
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

        {/* ===== Inventory Dashboard - الصيدلي فقط ===== */}
        {user?.role === 'pharmacist' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BeakerIcon className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('pharmacyPage.labels.inventoryAndMeds')}</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">{t('pharmacyPage.labels.total')} <span className="font-bold text-gray-800 dark:text-gray-100">{totalItems}</span> {t('pharmacyPage.labels.items')}</span>
                    <span className="text-gray-500">{t('pharmacyPage.labels.quantity')} <span className="font-bold text-gray-800 dark:text-gray-100">{totalQuantity}</span> {t('pharmacyPage.labels.pieces')}</span>
                    <span className="text-gray-500">{t('pharmacyPage.labels.low')} <span className="font-bold text-red-600">{lowStockItems}</span></span>
                    <span className="text-gray-500">{t('pharmacyPage.labels.value')} <span className="font-bold text-emerald-600">{totalValue.toLocaleString()} {t('pharmacyPage.labels.currency')}</span></span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={t('pharmacyPage.labels.searchPlaceholder')}
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="">{t('pharmacyPage.labels.allCategories')}</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select 
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  value={inventoryView}
                  onChange={(e) => setInventoryView(e.target.value)}
                >
                  <option value="all">{t('pharmacyPage.labels.allItems')}</option>
                  <option value="low">{t('pharmacyPage.labels.lowOnly')}</option>
                </select>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoryFilter('');
                    setInventoryView('all');
                  }}
                  className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  {t('pharmacyPage.actions.reset')}
                </button>
              </div>
            </div>

            {/* Inventory List */}
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">{t('pharmacyPage.empty.noInventoryMatch')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredInventory.map(item => {
                    const isExpanded = expandedInventoryId === item.id;
                    const isLowStock = item.quantity <= item.min_quantity;
                    return (
                      <div key={item.id} className={`border rounded-xl transition-all duration-300 ${isExpanded ? 'border-emerald-300 dark:border-emerald-700 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:shadow-sm'}`}>
                        <button 
                          onClick={() => toggleInventoryExpand(item.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLowStock ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                              <span className="text-lg">{isLowStock ? '⚠️' : '💊'}</span>
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">{item.category || t('pharmacyPage.labels.uncategorized')}</span>
                                <span className={`font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {item.quantity} {item.unit}
                                </span>
                                {isLowStock && <span className="text-red-500 font-bold">{t('pharmacyPage.labels.lowStock')}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 mr-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.price_per_unit} {t('pharmacyPage.labels.currency')}</span>
                            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
                                <p className="text-gray-500">{t('pharmacyPage.labels.quantityLabel')}</p>
                                <p className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
                                <p className="text-gray-500">{t('pharmacyPage.labels.minQuantity')}</p>
                                <p className="font-bold text-lg text-blue-600">{item.min_quantity}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
                                <p className="text-gray-500">{t('pharmacyPage.labels.unitPrice')}</p>
                                <p className="font-bold text-lg text-emerald-600">{item.price_per_unit} {t('pharmacyPage.labels.currency')}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
                                <p className="text-gray-500">{t('pharmacyPage.labels.totalValue')}</p>
                                <p className="font-bold text-lg text-purple-600">{(item.quantity * item.price_per_unit).toLocaleString()} {t('pharmacyPage.labels.currency')}</p>
                              </div>
                            </div>
                            {item.description && (
                              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                                <p className="text-sm text-gray-500">{t('pharmacyPage.labels.description')}</p>
                                <p className="text-gray-800 dark:text-gray-200">{item.description}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedStockItem(item);
                                  setStockQuantity(1);
                                  setShowStockModal(true);
                                }}
                                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors"
                              >
                                <ShoppingCartIcon className="w-4 h-4 inline ml-1" /> {t('pharmacyPage.actions.request')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Stock Requests Summary - الصيدلي فقط ===== */}
        {user?.role === 'pharmacist' && stockRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6 text-amber-500" />
                {t('pharmacyPage.labels.stockRequests')}
              </h3>
              <button onClick={() => setShowStockRequestsModal(true)} className="text-amber-600 dark:text-amber-400 hover:underline text-sm font-medium">
                {t('pharmacyPage.labels.viewAll', { count: stockRequests.length })}
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockRequests.slice(0, 4).map(req => {
                const item = stockItems.find(i => i.id === req.item_id);
                return (
                  <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{item?.name || t('pharmacyPage.labels.unknown')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('pharmacyPage.labels.quantityLabel')}: {req.requested_quantity}</p>
                      <p className="text-xs text-gray-400">{new Date(req.requested_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {req.status === 'pending' ? t('pharmacyPage.labels.pendingStatusBadge') :
                       req.status === 'approved' ? t('pharmacyPage.labels.approvedStatus') :
                       req.status === 'rejected' ? t('pharmacyPage.labels.rejectedStatus') :
                       t('pharmacyPage.labels.deliveredStatus')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Patients Grid - للصيدلي فقط ===== */}
        {user?.role === 'pharmacist' && patients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{t('pharmacyPage.labels.pharmacyPatients')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('pharmacyPage.labels.clickToViewPrescriptions')}</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(patient => {
                const count = prescriptions.filter(p => p.patient_id === patient.id).length;
                return (
                  <div key={patient.id} onClick={() => fetchPatientPrescriptions(patient)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{patient.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email}</p>
                      <span className="inline-flex items-center mt-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        {t('pharmacyPage.labels.prescriptionsCount', { count })}
                      </span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'all', label: t('pharmacyPage.tabs.all'), count: prescriptions.length, icon: '📋' },
              { id: 'pending', label: t('pharmacyPage.tabs.pending'), count: pendingPres.length, icon: '⏳' },
              { id: 'priced', label: t('pharmacyPage.tabs.priced'), count: pricedPres.length, icon: '💰' },
              { id: 'dispensed', label: t('pharmacyPage.tabs.dispensed'), count: dispensedPres.length, icon: '✅' },
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
        {currentPrescriptions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💊</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {user?.role === 'patient' && t('pharmacyPage.empty.noPrescriptionsPatient')}
              {user?.role === 'doctor' && t('pharmacyPage.empty.noPrescriptionsDoctor')}
              {user?.role === 'pharmacist' && t('pharmacyPage.empty.noPrescriptionsPharmacist')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {activeSection !== 'all' ? t('pharmacyPage.empty.tryOtherTab') : t('pharmacyPage.empty.willAppearHere')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentPrescriptions.map(p => {
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                  isExpanded ? 'border-green-300 dark:border-green-600 shadow-xl shadow-green-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-green-200 dark:hover:border-green-700'
                }`}>
                  {/* Status Bar */}
                  <div className={`h-1.5 ${getStatusBarColor(p)}`}></div>

                  {/* ===== Collapsed Header ===== */}
                  <button onClick={() => toggleExpand(p.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${getAvatarBg(p, isExpanded)}`}>
                        <span className="text-2xl">{isExpanded ? '📂' : getStatusIcon(p)}</span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {user?.role === 'patient' ? `${t('pharmacyPage.labels.doctorPrefix')} ${p.doctor_name}` : p.patient_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full font-medium">
                            {t('pharmacyPage.labels.medicationCount', { count: p.medications?.split('\n').filter(m => m.trim()).length || 1 })}
                          </span>
                          {getStatusBadge(p)}
                          {p.total_amount > 0 && (
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-medium">
                              💰 {p.total_amount} {t('pharmacyPage.labels.currency')}
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

                  {/* ===== Expanded Content ===== */}
                  <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-5">

                      {/* Info Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { icon: '👤', label: t('pharmacyPage.labels.patient'), value: p.patient_name, bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
                          { icon: '👨‍⚕️', label: t('pharmacyPage.labels.doctor'), value: p.doctor_name, bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-green-100 dark:border-green-800/30' },
                          { icon: '📅', label: t('pharmacyPage.labels.date'), value: new Date(p.created_at).toLocaleDateString('ar-EG'), bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
                        ].map((card, i) => (
                          <div key={i} className={`bg-gradient-to-r ${card.bg} rounded-xl p-4 border ${card.border} text-center`}>
                            <span className="text-2xl mb-2 block">{card.icon}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{card.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Pharmacist Info */}
                      {p.pharmacist_name && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pharmacyPage.labels.responsiblePharmacist')}</p>
                          <p className="font-bold text-gray-800 dark:text-gray-100">{p.pharmacist_name}</p>
                        </div>
                      )}

                      {/* Medications */}
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-3">
                          <span>💊</span> {t('pharmacyPage.labels.medications')}
                        </h4>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed">{p.medications}</p>
                        </div>
                      </div>

                      {/* Instructions */}
                      {p.instructions && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                          <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2"><span>📝</span> {t('pharmacyPage.labels.doctorInstructions')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{p.instructions}</p>
                        </div>
                      )}

                      {/* Price */}
                      {p.total_amount > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('pharmacyPage.labels.price')}</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{p.total_amount} {t('pharmacyPage.labels.currency')}</p>
                        </div>
                      )}

                      {/* Dispensed At */}
                      {p.dispensed_at && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <p className="text-xs text-gray-500">{t('pharmacyPage.labels.dispenseDate')}</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{new Date(p.dispensed_at).toLocaleString('ar-EG')}</p>
                        </div>
                      )}

                      {/* Waiting Notices */}
                      {user?.role === 'patient' && p.payment_status === 'paid' && p.status !== 'dispensed' && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30 text-center">
                          <p className="text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center gap-2">
                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                            {t('pharmacyPage.labels.waitingPharmacistApproval')}
                          </p>
                        </div>
                      )}

                      {user?.role === 'pharmacist' && p.status === 'price_set' && p.payment_status !== 'paid' && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30 text-center">
                          <p className="text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center gap-2">
                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                            {t('pharmacyPage.labels.waitingPatientPayment')}
                          </p>
                        </div>
                      )}

                      {/* Status Detail */}
                      <div className={`rounded-xl p-4 border ${
                        p.status === 'dispensed' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' :
                        p.status === 'price_set' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' :
                        'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
                      }`}>
                        <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          <span>{getStatusIcon(p)}</span> {t('pharmacyPage.labels.prescriptionStatus')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {p.status === 'pending' && t('pharmacyPage.labels.statusPendingPrice')}
                          {p.status === 'price_set' && p.payment_status === 'paid' && t('pharmacyPage.labels.statusPaidWaitingDispense')}
                          {p.status === 'price_set' && p.payment_status !== 'paid' && t('pharmacyPage.labels.statusPricedWaitingPayment')}
                          {p.status === 'dispensed' && t('pharmacyPage.labels.statusDispensed')}
                        </p>
                      </div>

                      {/* ===== Action Buttons ===== */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-green-300 dark:border-green-700">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <span className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">⚡</span>
                          {t('pharmacyPage.labels.actions')}
                        </h4>
                        <div className="flex gap-3 flex-wrap">
                          {/* View Details */}
                          <button onClick={() => viewPrescriptionDetails(p)}
                            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95">
                            <EyeIcon className="w-4 h-4" /> {t('pharmacyPage.actions.details')}
                          </button>

                          {/* Patient - Pay */}
                          {user?.role === 'patient' && p.status === 'price_set' && p.payment_status !== 'paid' && p.total_amount > 0 && (
                            <button onClick={() => handlePayment(p)}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
                              <CreditCardIcon className="w-4 h-4" /> {t('pharmacyPage.actions.pay', { amount: p.total_amount })}
                            </button>
                          )}

                          {/* Pharmacist - Set Price */}
                          {user?.role === 'pharmacist' && p.status === 'pending' && (
                            <button onClick={() => { setSelectedPrescription(p); setPriceAmount(p.total_amount || 0); setShowPriceModal(true); }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95">
                              {t('pharmacyPage.actions.setPrice')}
                            </button>
                          )}

                          {/* Pharmacist - Dispense */}
                          {user?.role === 'pharmacist' && p.status === 'price_set' && p.payment_status === 'paid' && (
                            <button onClick={() => handleDispense(p)}
                              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
                              {t('pharmacyPage.actions.dispense')}
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
            })}
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Stock Request Modal - للصيدلي فقط */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowStockModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6" />
                {t('pharmacyPage.labels.newStockRequest')}
              </h3>
              <button onClick={() => setShowStockModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('pharmacyPage.labels.requestedItem')}</label>
                <select className="input w-full" value={selectedStockItem?.id || ''} onChange={(e) => {
                  const item = stockItems.find(i => i.id === parseInt(e.target.value));
                  setSelectedStockItem(item);
                }}>
                  <option value="">{t('pharmacyPage.labels.selectItem')}</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {t('pharmacyPage.labels.available', { quantity: item.quantity, unit: item.unit })}
                    </option>
                  ))}
                </select>
              </div>
              {selectedStockItem && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-bold">{t('pharmacyPage.labels.currentlyAvailable')}</span> {selectedStockItem.quantity} {selectedStockItem.unit}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-bold">{t('pharmacyPage.labels.minQuantity')}:</span> {selectedStockItem.min_quantity} {selectedStockItem.unit}
                  </p>
                </div>
              )}
              <div>
                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('pharmacyPage.labels.requestedQuantity')}</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  placeholder={t('pharmacyPage.labels.enterQuantity')}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div>
                <label className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{t('pharmacyPage.labels.notes')}</label>
                <textarea 
                  className="input w-full" 
                  rows="2"
                  placeholder={t('pharmacyPage.labels.requestReason')}
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                />
              </div>
              <button onClick={handleRequestStock} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-amber-500/25 active:scale-95">
                <ShoppingCartIcon className="w-5 h-5 inline ml-2" />
                {t('pharmacyPage.actions.sendRequest')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Requests Modal - للصيدلي فقط */}
      {showStockRequestsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowStockRequestsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6 text-amber-500" />
                {t('pharmacyPage.labels.allStockRequests')}
              </h3>
              <button onClick={() => setShowStockRequestsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {stockRequests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <span className="text-4xl block mb-3">📦</span>
                  <p className="text-gray-500 dark:text-gray-400">{t('pharmacyPage.empty.noStockRequests')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockRequests.map(req => {
                    const item = stockItems.find(i => i.id === req.item_id);
                    return (
                      <div key={req.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{item?.name || t('pharmacyPage.labels.unknown')}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('pharmacyPage.labels.quantityLabel')}: {req.requested_quantity}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">📅 {new Date(req.requested_at).toLocaleDateString('ar-EG')}</p>
                            {req.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📝 {req.notes}</p>}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              req.status === 'approved' ? 'bg-green-100 text-green-700' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {req.status === 'pending' ? t('pharmacyPage.labels.pendingStatusBadge') :
                               req.status === 'approved' ? t('pharmacyPage.labels.approvedStatus') :
                               req.status === 'rejected' ? t('pharmacyPage.labels.rejectedStatus') :
                               t('pharmacyPage.labels.deliveredStatus')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Prescriptions Modal */}
      {showPatientPrescriptionsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientPrescriptionsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('pharmacyPage.labels.prescriptionsFor', { name: selectedPatient.username })}</h3>
              <button onClick={() => setShowPatientPrescriptionsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {patientPrescriptions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <span className="text-4xl block mb-3">💊</span>
                  <p className="text-gray-500 dark:text-gray-400">{t('pharmacyPage.empty.noPrescriptionsForPatient')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('pharmacyPage.empty.prescriptionsCount', { count: patientPrescriptions.length })}</p>
                  {patientPrescriptions.map(pres => (
                    <div key={pres.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-green-600 dark:text-green-400">{t('pharmacyPage.labels.fromDoctorName', { name: pres.doctor_name })}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">📅 {new Date(pres.created_at).toLocaleDateString('ar-EG')}</p>
                          <div className="mt-2">{getStatusBadge(pres)}</div>
                          {pres.total_amount > 0 && <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">💰 {pres.total_amount} {t('pharmacyPage.labels.currency')}</p>}
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-white dark:bg-gray-800 rounded-lg p-2 line-clamp-2 border border-gray-100 dark:border-gray-700">💊 {pres.medications}</p>
                        </div>
                        <button onClick={() => { setShowPatientPrescriptionsModal(false); viewPrescriptionDetails(pres); }}
                          className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex-shrink-0">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal - للدكتور فقط */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">{t('pharmacyPage.labels.addNewPrescription')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {patients.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl text-sm border border-amber-200 dark:border-amber-800">{t('pharmacyPage.labels.noPatientsAvailable')}</div>
              )}
              <div>
                <label className="label">{t('pharmacyPage.labels.patient')}</label>
                <select className="input" required value={requestData.patient_id} onChange={e => setRequestData({...requestData, patient_id: e.target.value})}>
                  <option value="">{t('pharmacyPage.labels.selectPatient')}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.username} {p.email ? `(${p.email})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('pharmacyPage.labels.pharmacist')}</label>
                <select className="input" required value={requestData.pharmacist_id} onChange={e => setRequestData({...requestData, pharmacist_id: e.target.value})}>
                  <option value="">{t('pharmacyPage.labels.selectPharmacist')}</option>
                  {pharmacists.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('pharmacyPage.labels.addMedications')}</label>
                <select className="input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">{t('pharmacyPage.labels.allCategories')}</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <select className="input flex-1" value={selectedMedication} onChange={e => setSelectedMedication(e.target.value)}>
                    <option value="">{t('pharmacyPage.labels.selectFromList')}</option>
                    {filteredMedications.map(m => <option key={m.id} value={m.id}>{m.name} - {m.price} {t('pharmacyPage.labels.currency')}</option>)}
                  </select>
                  <button type="button" onClick={addMedication} className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all active:scale-95 flex-shrink-0">+</button>
                </div>
                <input type="text" className="input" placeholder={t('pharmacyPage.labels.orTypeNewDrug')} value={customMedication} onChange={e => setCustomMedication(e.target.value)} />
              </div>

              {medicationsList.length > 0 && (
                <div className="bg-white dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2 max-h-40 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{t('pharmacyPage.labels.medicationListCount', { count: medicationsList.length })}</span>
                    <button type="button" onClick={clearAllMedications} className="text-red-500 text-xs hover:text-red-700">{t('pharmacyPage.actions.clearAll')}</button>
                  </div>
                  {medicationsList.map((med, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{med}</span>
                      <button type="button" onClick={() => removeMedicationLine(idx)} className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="label">{t('pharmacyPage.labels.instructions')}</label>
                <textarea className="input" placeholder={t('pharmacyPage.labels.dosageDuration')} rows="3" value={requestData.instructions} onChange={e => setRequestData({...requestData, instructions: e.target.value})} />
              </div>
              <button type="button" onClick={getAISuggestion} className="w-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-purple-200 dark:border-purple-800">
                <SparklesIcon className="w-5 h-5" /> {t('pharmacyPage.actions.aiAssist')}
              </button>
              <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-green-500/25 active:scale-95">
                {t('pharmacyPage.actions.submitPrescription')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {showPriceModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('pharmacyPage.labels.setPriceTitle')}</h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('pharmacyPage.labels.patient')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{selectedPrescription.patient_name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('pharmacyPage.labels.medications')}</p>
                <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{selectedPrescription.medications}</p>
              </div>
              <div>
                <label className="label">{t('pharmacyPage.labels.priceWithCurrency')}</label>
                <input type="number" className="input w-full" placeholder={t('pharmacyPage.labels.enterPrice')} value={priceAmount} onChange={e => setPriceAmount(parseFloat(e.target.value))} />
              </div>
              <button onClick={handleSetPrice} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                {t('pharmacyPage.actions.setPrice')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('pharmacyPage.labels.prescriptionDetails')}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('pharmacyPage.labels.patient'), value: selectedPrescription.patient_name },
                  { label: t('pharmacyPage.labels.doctor'), value: selectedPrescription.doctor_name },
                  { label: t('pharmacyPage.labels.pharmacist'), value: selectedPrescription.pharmacist_name || t('pharmacyPage.labels.notSpecified') },
                  { label: t('pharmacyPage.labels.date'), value: new Date(selectedPrescription.created_at).toLocaleDateString('ar-EG') },
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2"><span className="text-sm text-gray-500">{t('pharmacyPage.labels.status')}:</span> {getStatusBadge(selectedPrescription)}</div>
              {selectedPrescription.total_amount > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                  <p className="text-sm text-gray-500">{t('pharmacyPage.labels.price')}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedPrescription.total_amount} {t('pharmacyPage.labels.currency')}</p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('pharmacyPage.labels.medications')}</p>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl whitespace-pre-line text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{selectedPrescription.medications}</div>
              </div>
              {selectedPrescription.instructions && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{t('pharmacyPage.labels.doctorInstructions')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPrescription.instructions}</p>
                </div>
              )}
              {selectedPrescription.dispensed_at && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/30">
                  <p className="text-xs text-gray-500">{t('pharmacyPage.labels.dispenseDate')}</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{new Date(selectedPrescription.dispensed_at).toLocaleString('ar-EG')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">{t('pharmacyPage.labels.payPrescription')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('pharmacyPage.labels.fromDoctor')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{selectedPrescription.doctor_name}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('pharmacyPage.labels.totalAmount')}</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedPrescription.total_amount} {t('pharmacyPage.labels.currency')}</p>
              </div>
              <div>
                <label className="label">{t('pharmacyPage.labels.paymentMethod')}</label>
                <select className="input w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">{t('pharmacyPage.labels.cash')}</option>
                  <option value="card">{t('pharmacyPage.labels.card')}</option>
                  <option value="wallet">{t('pharmacyPage.labels.wallet')}</option>
                </select>
              </div>
              <button onClick={processPayment} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CreditCardIcon className="w-5 h-5" /> {t('pharmacyPage.actions.confirmPayment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAIModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> {t('pharmacyPage.labels.aiHelp')}</h3>
              <button onClick={() => setShowAIModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30 max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm">{aiSuggestion}</p>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all">{t('pharmacyPage.actions.close')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PharmacyPage;