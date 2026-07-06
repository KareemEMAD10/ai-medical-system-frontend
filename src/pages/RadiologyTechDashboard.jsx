import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CameraIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon,
  XMarkIcon, ChevronDownIcon, UserCircleIcon, EyeIcon,
  SparklesIcon, PhotoIcon, CurrencyDollarIcon, PlusIcon,
  ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const RadiologyTechDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedScanId, setExpandedScanId] = useState(null);
  const [activeSection, setActiveSection] = useState('pending');

  // ===== Search & Filter States =====
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal States
  const [selectedScan, setSelectedScan] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPatientScansModal, setShowPatientScansModal] = useState(false);

  // Data States
  const [resultText, setResultText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [scanImages, setScanImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientScans, setPatientScans] = useState([]);

  // ===== Revenue State =====
  const [revenueData, setRevenueData] = useState({
    total_revenue: 0,
    paid_revenue: 0,
    completed_revenue: 0
  });

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  // ===== Fetch Data =====
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [scansRes, patientsRes, revenueRes] = await Promise.all([
        api.get('/radiology/requests').catch(() => ({ data: [] })),
        api.get('/patients').catch(() => ({ data: [] })),
        api.get('/radiology/revenue').catch(() => ({ data: { total_revenue: 0, paid_revenue: 0, completed_revenue: 0 } }))
      ]);
      setScans(scansRes.data || []);
      setPatients(patientsRes.data || []);
      setRevenueData(revenueRes.data || { total_revenue: 0, paid_revenue: 0, completed_revenue: 0 });
    } catch (error) {
      toast.error(t('radiologyTechDashboard.messages.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Scan Images =====
  const fetchScanImages = async (scanId) => {
    try {
      const response = await api.get(`/radiology/requests/${scanId}/images`);
      const baseURL = 'http://localhost:8000';
      setScanImages((response.data || []).map(file => ({
        ...file,
        type: file.filename?.endsWith('.pdf') ? 'pdf' : 'image',
        url: `${baseURL}/files/radiology/${scanId}/${file.filename}`
      })));
    } catch (error) {
      setScanImages([]);
    }
  };

  // ===== Complete Scan (Add Report) =====
  const handleCompleteScan = async () => {
    if (!resultText || !selectedScan?.id) {
      toast.error(t('radiologyTechDashboard.messages.enter_report'));
      return;
    }
    try {
      await api.put(`/radiology/requests/${selectedScan.id}/complete`, { result: resultText });
      toast.success(t('radiologyTechDashboard.messages.report_added'));
      setShowResultModal(false);
      setSelectedScan(null);
      setResultText('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('radiologyTechDashboard.messages.report_add_failed'));
    }
  };

  // ===== Set Price =====
  const handleSetPrice = async () => {
    if (!selectedScan || selectedScan.total_amount <= 0) {
      toast.error(t('radiologyTechDashboard.messages.enter_valid_price'));
      return;
    }
    try {
      await api.put(`/radiology/requests/${selectedScan.id}/set-price`, {
        total_amount: selectedScan.total_amount
      });
      toast.success(t('radiologyTechDashboard.messages.price_set'));
      setShowPriceModal(false);
      setSelectedScan(null);
      fetchData();
    } catch (error) {
      toast.error(t('radiologyTechDashboard.messages.price_failed'));
    }
  };

  // ===== AI Analysis =====
  const getAIAnalysis = async (scan) => {
    setSelectedScan(scan);
    setShowAIModal(true);
    setAiAnalysis(t('radiologyTechDashboard.messages.analyzing'));
    try {
      const response = await api.post('/ai/analyze-radiology', {
        scan_id: scan.id,
        scan_type: scan.scan_type,
        body_part: scan.body_part,
        description: scan.description,
        result: scan.result
      });
      setAiAnalysis(response.data.analysis || response.data.result || t('radiologyTechDashboard.messages.analysis_complete'));
      toast.success(t('radiologyTechDashboard.messages.ai_analysis_done'));
    } catch (error) {
      setAiAnalysis(t('radiologyTechDashboard.messages.analysis_error'));
    }
  };

  // ===== Upload Files =====
  const handleUploadFiles = async (scan) => {
    setSelectedScan(scan);
    setUploadedFiles([]);
    await fetchScanImages(scan.id);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedScan?.id) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "application/pdf"];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(t('radiologyTechDashboard.messages.unsupported_files'));
      return;
    }
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("scan_id", String(selectedScan.id));
    try {
      const response = await api.post("/radiology/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(t('radiologyTechDashboard.messages.upload_success', { count: files.length }));
      await fetchScanImages(selectedScan.id);
      setUploadedFiles([...uploadedFiles, ...(response.data.files || [])]);
    } catch (error) {
      toast.error(t('radiologyTechDashboard.messages.upload_failed'));
    }
  };

  const deleteImage = async (imageId) => {
    if (!selectedScan?.id) return;
    try {
      await api.delete(`/radiology/images/${selectedScan.id}/${imageId}`);
      toast.success(t('radiologyTechDashboard.messages.file_deleted'));
      await fetchScanImages(selectedScan.id);
    } catch (error) {
      toast.error(t('radiologyTechDashboard.messages.file_delete_failed'));
    }
  };

  // ===== View Details =====
  const viewScanDetails = async (scan) => {
    setSelectedScan(scan);
    await fetchScanImages(scan.id);
    setShowDetailsModal(true);
  };

  // ===== Patient Scans =====
  const fetchPatientScans = (patient) => {
    const filteredScans = scans.filter(scan => scan.patient_id === patient.id);
    setSelectedPatient(patient);
    setPatientScans(filteredScans);
    setShowPatientScansModal(true);
    if (filteredScans.length === 0) {
      toast.info(t('radiologyTechDashboard.messages.no_scans_for_patient', { name: patient.username }));
    }
  };

  const toggleExpand = (id) => setExpandedScanId(expandedScanId === id ? null : id);

  useEffect(() => { fetchData(); }, []);

  // ===== Filter Scans by Tab =====
  const pendingScans = scans.filter(s => s.status === 'pending');
  const pricedScans = scans.filter(s => s.status === 'price_set');
  const paidScans = scans.filter(s => s.status === 'paid');
  const completedScans = scans.filter(s => s.status === 'completed');

  // ===== SEARCH & FILTER LOGIC =====
  const filteredScans = useMemo(() => {
    let result = scans;

    if (activeSection !== 'all') {
      result = result.filter(s => s.status === activeSection);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(scan => {
        switch (searchType) {
          case 'patient':
            return scan.patient_name?.toLowerCase().includes(query);
          case 'scan_type':
            return scan.scan_type?.toLowerCase().includes(query);
          case 'body_part':
            return scan.body_part?.toLowerCase().includes(query);
          case 'doctor':
            return scan.doctor_name?.toLowerCase().includes(query);
          case 'all':
          default:
            return (
              scan.patient_name?.toLowerCase().includes(query) ||
              scan.scan_type?.toLowerCase().includes(query) ||
              scan.body_part?.toLowerCase().includes(query) ||
              scan.doctor_name?.toLowerCase().includes(query) ||
              scan.status?.toLowerCase().includes(query) ||
              String(scan.id).includes(query)
            );
        }
      });
    }

    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      result = result.filter(s => new Date(s.created_at) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(s => new Date(s.created_at) <= toDate);
    }

    return result;
  }, [scans, activeSection, searchQuery, searchType, filterStatus, filterDateFrom, filterDateTo]);

  const filteredPatients = useMemo(() => {
    if (searchQuery.trim() === '') return patients;
    const query = searchQuery.trim().toLowerCase();
    return patients.filter(p => 
      p.username?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const getTabScans = () => {
    return filteredScans;
  };

  // ===== Status Badge =====
  const getStatusBadge = (scan) => {
    const badges = {
      'completed': { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', text: t('radiologyTechDashboard.labels.status_badge_completed'), icon: '✅' },
      'paid': { cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: t('radiologyTechDashboard.labels.status_badge_paid'), icon: '💳' },
      'price_set': { cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800', text: t('radiologyTechDashboard.labels.status_badge_priced'), icon: '💰' },
    };
    const badge = badges[scan.status] || { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', text: t('radiologyTechDashboard.labels.status_badge_pending'), icon: '⏳' };
    return <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${badge.cls}`}>{badge.text}</span>;
  };

  const getStatusIcon = (scan) => {
    const icons = { 'completed': '✅', 'paid': '💳', 'price_set': '💰' };
    return icons[scan.status] || '⏳';
  };

  const getStatusBarColor = (status) => {
    const colors = {
      'completed': 'from-emerald-400 via-teal-400 to-green-400',
      'paid': 'from-blue-400 via-indigo-400 to-purple-400',
      'price_set': 'from-purple-400 via-pink-400 to-rose-400',
    };
    return colors[status] || 'from-amber-400 via-orange-400 to-yellow-400';
  };

  const getExpandedBg = (status, isExpanded) => {
    const expanded = {
      'completed': 'bg-gradient-to-br from-emerald-500 to-teal-600',
      'paid': 'bg-gradient-to-br from-blue-500 to-indigo-600',
      'price_set': 'bg-gradient-to-br from-purple-500 to-pink-600',
    };
    const collapsed = {
      'completed': 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
      'paid': 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40',
      'price_set': 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40',
    };
    if (isExpanded) return expanded[status] || 'bg-gradient-to-br from-amber-500 to-orange-600';
    return collapsed[status] || 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40';
  };

  // ===== Clear Search =====
  const clearSearch = () => {
    setSearchQuery('');
    setSearchType('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setShowFilters(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 dark:border-cyan-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('radiologyTechDashboard.labels.loading')}</p>
        </div>
      </Layout>
    );
  }

  const currentScans = getTabScans();

  // ===== Calculate Revenue for Stats =====
  const totalRevenue = revenueData.total_revenue || 
    paidScans.reduce((sum, s) => sum + (s.total_amount || 0), 0) + 
    completedScans.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-500 dark:from-cyan-900 dark:via-teal-900 dark:to-emerald-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>

          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-4xl">📷</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t('radiologyTechDashboard.labels.title')}</h1>
                <p className="text-cyan-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                  {t('radiologyTechDashboard.labels.welcome', { username: user?.username })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearSearch} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/20">
                {t('radiologyTechDashboard.actions.clear_search')}
              </button>
              <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('radiologyTechDashboard.actions.refresh')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: t('radiologyTechDashboard.labels.pending'), count: pendingScans.length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
              { label: t('radiologyTechDashboard.labels.priced'), count: pricedScans.length, icon: '💰', color: 'from-purple-400/20 to-purple-500/20' },
              { label: t('radiologyTechDashboard.labels.paid'), count: paidScans.length, icon: '💳', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('radiologyTechDashboard.labels.completed'), count: completedScans.length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('radiologyTechDashboard.labels.revenue'), count: `${totalRevenue} ${t('radiologyTechDashboard.labels.currency')}`, icon: '💵', color: 'from-green-400/20 to-green-500/20' },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all duration-300`}>
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

        {/* ===== SEARCH & FILTER SECTION ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 w-full relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder={t('radiologyTechDashboard.labels.search_placeholder')}
                  className="w-full pr-11 pl-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-800 dark:text-gray-100 text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Type Dropdown */}
              <select
                className="w-full md:w-48 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-800 dark:text-gray-100 text-sm"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="all">{t('radiologyTechDashboard.labels.search_all')}</option>
                <option value="patient">{t('radiologyTechDashboard.labels.search_patient')}</option>
                <option value="scan_type">{t('radiologyTechDashboard.labels.search_scan_type')}</option>
                <option value="body_part">{t('radiologyTechDashboard.labels.search_body_part')}</option>
                <option value="doctor">{t('radiologyTechDashboard.labels.search_doctor')}</option>
              </select>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  showFilters 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>{t('radiologyTechDashboard.labels.filter')}</span>
                {(filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Results Count */}
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <DocumentMagnifyingGlassIcon className="w-4 h-4 inline ml-1" />
                {t('radiologyTechDashboard.labels.results_count', { count: currentScans.length })}
              </span>
            </div>

            {/* ===== Advanced Filters Panel ===== */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('radiologyTechDashboard.labels.status')}</label>
                  <select
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">{t('radiologyTechDashboard.labels.all')}</option>
                    <option value="pending">{t('radiologyTechDashboard.labels.status_pending')}</option>
                    <option value="price_set">{t('radiologyTechDashboard.labels.status_priced')}</option>
                    <option value="paid">{t('radiologyTechDashboard.labels.status_paid')}</option>
                    <option value="completed">{t('radiologyTechDashboard.labels.status_completed')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('radiologyTechDashboard.labels.date_from')}</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('radiologyTechDashboard.labels.date_to')}</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearSearch}
                    className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800/30"
                  >
                    {t('radiologyTechDashboard.actions.clear_filter')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== Patients Grid - Filtered ===== */}
        {filteredPatients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{t('radiologyTechDashboard.labels.patients_title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('radiologyTechDashboard.labels.patients_hint')}</p>
              </div>
              {searchQuery && (
                <span className="text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded-full font-medium">
                  {t('radiologyTechDashboard.labels.patient_count', { count: filteredPatients.length })}
                </span>
              )}
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map(patient => {
                const patientScanCount = scans.filter(s => s.patient_id === patient.id).length;
                return (
                  <div key={patient.id} onClick={() => fetchPatientScans(patient)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{patient.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email}</p>
                      <span className="inline-flex items-center mt-1 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium">
                        {t('radiologyTechDashboard.labels.scan_count', { count: patientScanCount })}
                      </span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Section Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'pending', label: t('radiologyTechDashboard.tabs.pending'), count: pendingScans.length, icon: '⏳' },
              { id: 'priced', label: t('radiologyTechDashboard.tabs.priced'), count: pricedScans.length, icon: '💰' },
              { id: 'paid', label: t('radiologyTechDashboard.tabs.paid'), count: paidScans.length, icon: '💳' },
              { id: 'completed', label: t('radiologyTechDashboard.tabs.completed'), count: completedScans.length, icon: '✅' },
              { id: 'all', label: t('radiologyTechDashboard.tabs.all'), count: scans.length, icon: '📋' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
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

        {/* ===== Scans List - Expandable with Search Highlight ===== */}
        <div className="space-y-3">
          {currentScans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
              <div className="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CameraIcon className="w-10 h-10 text-cyan-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {searchQuery ? t('radiologyTechDashboard.labels.no_search_results') : t('radiologyTechDashboard.labels.no_requests')}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {searchQuery ? t('radiologyTechDashboard.labels.try_change_search') : t('radiologyTechDashboard.labels.try_other_tab')}
              </p>
              {searchQuery && (
                <button onClick={clearSearch} className="mt-4 text-cyan-500 hover:text-cyan-600 font-semibold text-sm">
                  {t('radiologyTechDashboard.actions.clear_search')}
                </button>
              )}
            </div>
          ) : (
            currentScans.map(scan => {
              const isExpanded = expandedScanId === scan.id;
              const highlightText = (text) => {
                if (!searchQuery.trim() || !text) return text;
                const query = searchQuery.trim().toLowerCase();
                const index = text.toLowerCase().indexOf(query);
                if (index === -1) return text;
                return (
                  <>
                    {text.substring(0, index)}
                    <span className="bg-yellow-200 dark:bg-yellow-800/60 px-0.5 rounded font-bold">
                      {text.substring(index, index + query.length)}
                    </span>
                    {text.substring(index + query.length)}
                  </>
                );
              };

              return (
                <div key={scan.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                  isExpanded ? 'border-cyan-300 dark:border-cyan-600 shadow-xl shadow-cyan-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'
                }`}>
                  {/* Status Bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${getStatusBarColor(scan.status)}`}></div>

                  {/* ===== Collapsed Header ===== */}
                  <button onClick={() => toggleExpand(scan.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${getExpandedBg(scan.status, isExpanded)}`}>
                        <span className="text-2xl">{isExpanded ? '📂' : getStatusIcon(scan)}</span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {highlightText(scan.patient_name)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-full font-medium">
                            📷 {highlightText(scan.scan_type)}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                            📍 {highlightText(scan.body_part)}
                          </span>
                          {getStatusBadge(scan)}
                          {scan.total_amount > 0 && (
                            <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full font-medium">
                              {t('radiologyTechDashboard.labels.money_amount', { amount: scan.total_amount })}
                            </span>
                          )}
                          {scan.status === 'pending' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                      isExpanded ? 'bg-cyan-100 dark:bg-cyan-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'
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
                          { icon: '👤', label: t('radiologyTechDashboard.labels.patient'), value: scan.patient_name, bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
                          { icon: '📷', label: t('radiologyTechDashboard.labels.scan_type'), value: scan.scan_type, bg: 'from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20', border: 'border-cyan-100 dark:border-cyan-800/30' },
                          { icon: '📍', label: t('radiologyTechDashboard.labels.body_part'), value: scan.body_part, bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
                        ].map((card, i) => (
                          <div key={i} className={`bg-gradient-to-r ${card.bg} rounded-xl p-4 border ${card.border} text-center`}>
                            <span className="text-2xl mb-2 block">{card.icon}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{highlightText(card.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Doctor Info */}
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>{t('radiologyTechDashboard.labels.doctor_info')}</span></h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{highlightText(scan.doctor_name)}</p>
                      </div>

                      {/* Description */}
                      {scan.description && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>{t('radiologyTechDashboard.labels.notes_label')}</span></h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{highlightText(scan.description)}</p>
                        </div>
                      )}

                      {/* Price Info */}
                      {scan.total_amount > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('radiologyTechDashboard.labels.price_label')}</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{t('radiologyTechDashboard.labels.money_amount', { amount: scan.total_amount })}</p>
                        </div>
                      )}

                      {/* Result / Report */}
                      {scan.result && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2"><span>{t('radiologyTechDashboard.labels.result_label')}</span></h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 whitespace-pre-line">
                            {highlightText(scan.result)}
                          </p>
                        </div>
                      )}

                      {/* Status Detail */}
                      <div className={`rounded-xl p-4 border ${
                        scan.status === 'pending' ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30' :
                        scan.status === 'price_set' ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800/30' :
                        scan.status === 'paid' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30' :
                        'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30'
                      }`}>
                        <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          <span>{getStatusIcon(scan)}</span> {t('radiologyTechDashboard.labels.status_detail')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {scan.status === 'pending' && t('radiologyTechDashboard.labels.status_pending_desc')}
                          {scan.status === 'price_set' && t('radiologyTechDashboard.labels.status_priced_desc')}
                          {scan.status === 'paid' && t('radiologyTechDashboard.labels.status_paid_desc')}
                          {scan.status === 'completed' && t('radiologyTechDashboard.labels.status_completed_desc')}
                        </p>
                      </div>

                      {/* ===== Action Buttons ===== */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-cyan-300 dark:border-cyan-700">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <span className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg flex items-center justify-center">⚡</span>
                          {t('radiologyTechDashboard.labels.available_actions')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          {/* تحديد السعر - للمعلقة فقط */}
                          {scan.status === 'pending' && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedScan(scan); setShowPriceModal(true); }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95">
                              {t('radiologyTechDashboard.actions.set_price')}
                            </button>
                          )}

                          {/* إضافة/تعديل تقرير */}
                          {(scan.status === 'paid' || scan.status === 'price_set') && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedScan(scan); setResultText(scan.result || ''); setShowResultModal(true); }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95">
                              📋 {scan.result ? t('radiologyTechDashboard.actions.edit_report') : t('radiologyTechDashboard.actions.add_report')}
                            </button>
                          )}

                          {/* رفع ملفات */}
                          <button onClick={(e) => { e.stopPropagation(); handleUploadFiles(scan); }}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95">
                            <PhotoIcon className="w-5 h-5" /> {t('radiologyTechDashboard.actions.upload_files')}
                          </button>

                          {/* عرض التفاصيل */}
                          <button onClick={(e) => { e.stopPropagation(); viewScanDetails(scan); }}
                            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 active:scale-95">
                            <EyeIcon className="w-5 h-5" /> {t('radiologyTechDashboard.actions.full_details')}
                          </button>

                          {/* تحليل AI */}
                          {scan.result && (
                            <button onClick={(e) => { e.stopPropagation(); getAIAnalysis(scan); }}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-95">
                              <SparklesIcon className="w-5 h-5" /> {t('radiologyTechDashboard.actions.ai_analysis')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{t('radiologyTechDashboard.labels.id_label')}</span>
                          <span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">#{scan.id}</span>
                        </div>
                        <span className="text-xs text-gray-400">{t('radiologyTechDashboard.labels.date_label')} {scan.created_at ? new Date(scan.created_at).toLocaleDateString('ar-EG') : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Price Modal */}
      {showPriceModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('radiologyTechDashboard.labels.set_price_title')}</h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm text-gray-500">{t('radiologyTechDashboard.labels.patient_name')} <span className="font-bold text-gray-800 dark:text-gray-100">{selectedScan.patient_name}</span></p>
                <p className="text-sm text-gray-500 mt-1">{t('radiologyTechDashboard.labels.scan_info')} <span className="font-bold text-gray-800 dark:text-gray-100">{selectedScan.scan_type} - {selectedScan.body_part}</span></p>
              </div>
              <div>
                <label className={labelClass}>{t('radiologyTechDashboard.labels.price_input')}</label>
                <input type="number" className={inputClass} placeholder={t('radiologyTechDashboard.labels.enter_price')} value={selectedScan.total_amount || 0} onChange={e => setSelectedScan({...selectedScan, total_amount: parseFloat(e.target.value)})} />
              </div>
              <button onClick={handleSetPrice} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">{t('radiologyTechDashboard.actions.set_price')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResultModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">📋 {selectedScan.result ? t('radiologyTechDashboard.labels.edit_report') : t('radiologyTechDashboard.labels.add_report')}</h3>
              <button onClick={() => setShowResultModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-sm text-gray-500">{t('radiologyTechDashboard.labels.patient_name')} <span className="font-bold">{selectedScan.patient_name}</span></p>
                <p className="text-sm text-gray-500">{t('radiologyTechDashboard.labels.scan_info')} <span className="font-bold">{selectedScan.scan_type} - {selectedScan.body_part}</span></p>
              </div>
              <button onClick={() => getAIAnalysis(selectedScan)} className="w-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-purple-200 dark:border-purple-800">
                <SparklesIcon className="w-4 h-4" /> {t('radiologyTechDashboard.labels.ai_help')}
              </button>
              <textarea className={inputClass} rows="6" placeholder={t('radiologyTechDashboard.labels.enter_result_placeholder')} value={resultText} onChange={e => setResultText(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleCompleteScan} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">{t('radiologyTechDashboard.actions.save')}</button>
                <button onClick={() => setShowResultModal(false)} className="px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('radiologyTechDashboard.actions.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyTechDashboard.labels.upload_files_title')}</h3>
              <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border-2 border-dashed border-cyan-300 dark:border-cyan-700 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors bg-cyan-50/50 dark:bg-cyan-900/10">
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" id="file-upload-tech" />
                <label htmlFor="file-upload-tech" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/40 rounded-2xl flex items-center justify-center mb-3"><PhotoIcon className="w-8 h-8 text-cyan-500" /></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('radiologyTechDashboard.labels.click_to_upload')}</span>
                  <span className="text-xs text-gray-400 mt-1">{t('radiologyTechDashboard.labels.upload_formats')}</span>
                </label>
              </div>
              {scanImages.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('radiologyTechDashboard.labels.files_section', { count: scanImages.length })}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {scanImages.map((file, idx) => (
                      <div key={idx} className="relative group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-1">
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">{file.filename}</p>
                          </div>
                        ) : <img src={file.url} alt={`scan-${idx}`} className="w-full h-24 object-cover" />}
                        <button onClick={() => deleteImage(file.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowUploadModal(false)} className="w-full py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('radiologyTechDashboard.actions.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyTechDashboard.labels.details_title')}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('radiologyTechDashboard.labels.patient'), value: selectedScan.patient_name },
                  { label: t('radiologyTechDashboard.labels.doctor_name'), value: selectedScan.doctor_name },
                  { label: t('radiologyTechDashboard.labels.scan_type'), value: selectedScan.scan_type },
                  { label: t('radiologyTechDashboard.labels.body_part'), value: selectedScan.body_part },
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2"><span className="text-sm text-gray-500">{t('radiologyTechDashboard.labels.status')}:</span> {getStatusBadge(selectedScan)}</div>
              {selectedScan.description && <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-500 mb-1">{t('radiologyTechDashboard.labels.notes_label')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedScan.description}</p></div>}
              {selectedScan.total_amount > 0 && <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center"><p className="text-sm text-gray-500">{t('radiologyTechDashboard.labels.price')}</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{t('radiologyTechDashboard.labels.money_amount', { amount: selectedScan.total_amount })}</p></div>}
              {selectedScan.result && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex justify-between items-center mb-2"><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t('radiologyTechDashboard.labels.result_label')}</p><button onClick={() => getAIAnalysis(selectedScan)} className="text-purple-600 text-xs flex items-center gap-1 hover:text-purple-700"><SparklesIcon className="w-4 h-4" /> {t('radiologyTechDashboard.actions.ai_analysis')}</button></div>
                  <p className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line border border-emerald-100 dark:border-emerald-800/30">{selectedScan.result}</p>
                </div>
              )}
              {scanImages.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('radiologyTechDashboard.labels.attached_files', { count: scanImages.length })}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {scanImages.map((file, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30 hover:shadow-md transition-all">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2"><svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">{file.filename}</p>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-500 hover:underline mt-1">{t('radiologyTechDashboard.labels.open_pdf')}</a>
                          </div>
                        ) : <img src={file.url} alt={`scan-${idx}`} className="w-full h-32 object-cover" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Scans Modal */}
      {showPatientScansModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientScansModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyTechDashboard.labels.patient_scans', { name: selectedPatient.username })}</h3>
              <button onClick={() => setShowPatientScansModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {patientScans.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <CameraIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{t('radiologyTechDashboard.labels.no_scans_for_patient')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('radiologyTechDashboard.labels.scans_count', { count: patientScans.length })}</p>
                  {patientScans.map(scan => (
                    <div key={scan.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-cyan-600 dark:text-cyan-400">{scan.scan_type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📍 {scan.body_part}</p>
                          <p className="text-xs text-gray-400 mt-1">{t('radiologyTechDashboard.labels.date_label')} {new Date(scan.created_at).toLocaleDateString('ar-EG')}</p>
                          <div className="mt-2">{getStatusBadge(scan)}</div>
                          {scan.total_amount > 0 && <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{t('radiologyTechDashboard.labels.money_amount', { amount: scan.total_amount })}</p>}
                          {scan.result && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-white dark:bg-gray-800 rounded-lg p-2 text-xs line-clamp-2">{t('radiologyTechDashboard.labels.result_label')} {scan.result}</p>}
                        </div>
                        <button onClick={() => { setShowPatientScansModal(false); viewScanDetails(scan); }} className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
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

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAIModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> {t('radiologyTechDashboard.labels.ai_analysis_title')}</h3>
              <button onClick={() => setShowAIModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30 max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm">{aiAnalysis}</p>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all">{t('radiologyTechDashboard.actions.close')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RadiologyTechDashboard;
