import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CameraIcon, PlusIcon, XMarkIcon, SparklesIcon, EyeIcon, 
  PhotoIcon, CurrencyDollarIcon, ChevronDownIcon, ArrowPathIcon,
  UserCircleIcon, CheckCircleIcon, ClockIcon
} from '@heroicons/react/24/outline';

const RadiologyPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [radiologyTechs, setRadiologyTechs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPatientScansModal, setShowPatientScansModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientScans, setPatientScans] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [resultText, setResultText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [scanTypes, setScanTypes] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
  const [scanImages, setScanImages] = useState([]);
  const [expandedScanId, setExpandedScanId] = useState(null);
  
  const [requestData, setRequestData] = useState({
    patient_id: '', radiology_tech_id: '', scan_type: '', body_part: '', description: '', total_amount: 0
  });

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const toggleExpand = (id) => setExpandedScanId(expandedScanId === id ? null : id);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const scansRes = await api.get('/radiology/requests').catch(() => ({ data: [] }));
      setScans(scansRes.data || []);
      const typesRes = await api.get('/radiology/scan-types').catch(() => ({ data: [] }));
      setScanTypes(typesRes.data || []);
      const bodyPartsRes = await api.get('/radiology/body-parts').catch(() => ({ data: [] }));
      setBodyParts(bodyPartsRes.data || ["head","neck","chest","abdomen","back","pelvis","shoulder","elbow","wrist","hand","hip","knee","ankle","foot"]);
      const techsRes = await api.get('/users/by-role/radiology_tech').catch(() => ({ data: [] }));
      setRadiologyTechs(techsRes.data || []);
      if (user?.role === 'doctor') {
        const patientsRes = await api.get('/doctors/my-patients').catch(() => ({ data: [] }));
        setPatients(patientsRes.data || []);
      } else if (user?.role === 'radiology_tech') {
        const patientsRes = await api.get('/patients').catch(() => ({ data: [] }));
        setPatients(patientsRes.data || []);
      } else { setPatients([]); }
    } catch (error) { toast.error(t('radiologyPage.messages.loadError')); }
    finally { setIsLoading(false); }
  };

  const fetchPatientScans = (patient) => {
    const filteredScans = scans.filter(scan => scan.patient_id === patient.id);
    setSelectedPatient(patient); setPatientScans(filteredScans); setShowPatientScansModal(true);
    if (filteredScans.length === 0) toast.info(t('radiologyPage.messages.noScansForPatient', { name: patient.username }));
  };

  const fetchScanImages = async (scanId) => {
    try {
      const response = await api.get(`/radiology/requests/${scanId}/images`);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      setScanImages((response.data || []).map(file => ({ ...file, type: file.filename?.endsWith('.pdf') ? 'pdf' : 'image', url: `${baseURL}/files/radiology/${scanId}/${file.filename}` })));
    } catch (error) { setScanImages([]); }
  };

  const getAIAnalysis = async (scan) => {
    setSelectedScan(scan); setShowAIModal(true); setAiAnalysis(t('radiologyPage.messages.analyzing'));
    try {
      const response = await api.post('/ai/analyze-radiology', { scan_id: scan.id, scan_type: scan.scan_type, body_part: scan.body_part, description: scan.description, result: scan.result });
      setAiAnalysis(response.data.analysis || response.data.result || t('radiologyPage.messages.analysisSuccess'));
    } catch (error) { setAiAnalysis(t('radiologyPage.messages.analysisError')); }
  };

  const handlePayment = (scan) => { setSelectedScan(scan); setPaymentMethod('cash'); setShowPaymentModal(true); };

  const processPayment = async () => {
    if (!selectedScan) return;
    try {
      await api.post('/radiology/payments', { scan_id: selectedScan.id, amount: selectedScan.total_amount, payment_method: paymentMethod, patient_id: user?.id });
      toast.success(t('radiologyPage.messages.paymentSuccess', { amount: selectedScan.total_amount })); setShowPaymentModal(false); setSelectedScan(null); fetchData();
    } catch (error) { toast.error(error.response?.data?.detail || t('radiologyPage.messages.paymentFailed')); }
  };

  const handleUploadFiles = async (scan) => { setSelectedScan(scan); setUploadedFiles([]); await fetchScanImages(scan.id); setShowUploadModal(true); };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedScan?.id) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "application/pdf"];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) { toast.error(t('radiologyPage.messages.unsupportedFiles')); return; }
    const formData = new FormData();
    files.forEach(f => formData.append("files", f)); formData.append("scan_id", String(selectedScan.id));
    try {
      const response = await api.post("/radiology/upload-images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t('radiologyPage.messages.uploadSuccess', { count: files.length })); await fetchScanImages(selectedScan.id);
      setUploadedFiles([...uploadedFiles, ...(response.data.files || [])]);
    } catch (error) { toast.error(t('radiologyPage.messages.uploadFailed')); }
  };

  const deleteImage = async (imageId) => {
    if (!selectedScan?.id) return;
    try { await api.delete(`/radiology/images/${selectedScan.id}/${imageId}`); toast.success(t('radiologyPage.messages.fileDeleted')); await fetchScanImages(selectedScan.id); }
    catch (error) { toast.error(t('radiologyPage.messages.fileDeleteFailed')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.patient_id || !requestData.radiology_tech_id || !requestData.scan_type || !requestData.body_part) { toast.error(t('radiologyPage.messages.completeAllData')); return; }
    try { await api.post('/radiology/requests', requestData); toast.success(t('radiologyPage.messages.scanRequestSent')); setShowModal(false); setRequestData({ patient_id: '', radiology_tech_id: '', scan_type: '', body_part: '', description: '', total_amount: 0 }); fetchData(); }
    catch (error) { toast.error(error.response?.data?.detail || t('radiologyPage.messages.sendFailed')); }
  };

  const handleCompleteScan = async () => {
    if (!resultText || !selectedScan?.id) { toast.error(t('radiologyPage.messages.enterResult')); return; }
    try { await api.put(`/radiology/requests/${selectedScan.id}/complete`, { result: resultText }); toast.success(t('radiologyPage.messages.reportAdded')); setShowResultModal(false); setSelectedScan(null); setResultText(''); fetchData(); }
    catch (error) { toast.error(t('radiologyPage.messages.reportAddFailed')); }
  };

  const handleSetPrice = async () => {
    if (!selectedScan || selectedScan.total_amount <= 0) { toast.error(t('radiologyPage.messages.enterValidPrice')); return; }
    try { await api.put(`/radiology/requests/${selectedScan.id}/set-price`, { total_amount: selectedScan.total_amount }); toast.success(t('radiologyPage.messages.priceSetSuccess')); setShowPriceModal(false); setSelectedScan(null); fetchData(); }
    catch (error) { toast.error(t('radiologyPage.messages.priceSetFailed')); }
  };

  const viewScanDetails = async (scan) => { setSelectedScan(scan); await fetchScanImages(scan.id); setShowDetailsModal(true); };

  useEffect(() => { fetchData(); }, [user?.role]);

  if (isLoading) {
    return (<Layout><div className="flex flex-col items-center justify-center h-80 gap-4"><div className="relative"><div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900"></div><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 dark:border-cyan-400 absolute top-0 left-0"></div></div><p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('radiologyPage.labels.loading')}</p></div></Layout>);
  }

  const getStatusBadge = (scan) => {
    const badges = {
      'completed': { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', text: t('radiologyPage.labels.completed') },
      'paid': { cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: t('radiologyPage.labels.paid') },
      'price_set': { cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800', text: t('radiologyPage.labels.priced') },
    };
    const badge = badges[scan.status] || { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', text: t('radiologyPage.labels.pending') };
    return <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${badge.cls}`}>{badge.text}</span>;
  };

  const filteredScans = (() => {
    if (!scans) return [];
    if (user?.role === 'radiology_tech') return scans.filter(s => s.status === 'pending' || s.status === 'price_set' || s.status === 'paid');
    if (user?.role === 'patient') return scans.filter(s => s.patient_id === user.id);
    if (user?.role === 'doctor') return scans.filter(s => s.doctor_id === user.id);
    return scans;
  })();

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-500 dark:from-cyan-900 dark:via-teal-900 dark:to-blue-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>
          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20"><span className="text-4xl">📷</span></div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t('radiologyPage.labels.title')}</h1>
                <p className="text-cyan-100 mt-2 text-base">
                  {user?.role === 'doctor' && t('radiologyPage.labels.doctorSubtitle')}
                  {user?.role === 'radiology_tech' && t('radiologyPage.labels.techSubtitle')}
                  {user?.role === 'patient' && t('radiologyPage.labels.patientSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user?.role === 'doctor' && (
                <button onClick={() => setShowModal(true)} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                  <PlusIcon className="w-5 h-5" /> {t('radiologyPage.actions.newRequest')}
                </button>
              )}
              <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('radiologyPage.actions.refresh')}
              </button>
            </div>
          </div>

          {/* Admin Stats */}
          {user?.role === 'admin' && (
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: t('radiologyPage.tabs.pending'), count: scans.filter(s => s.status === 'pending').length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
                { label: t('radiologyPage.labels.priced'), count: scans.filter(s => s.status === 'price_set').length, icon: '💰', color: 'from-purple-400/20 to-purple-500/20' },
                { label: t('radiologyPage.labels.completed'), count: scans.filter(s => s.status === 'completed').length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
                { label: t('radiologyPage.labels.revenue'), count: `${scans.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.total_amount || 0), 0)} ${t('radiologyPage.labels.currency')}`, icon: '💵', color: 'from-blue-400/20 to-blue-500/20' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10`}>
                  <div className="flex items-center gap-3"><span className="text-2xl">{stat.icon}</span><div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-white/70 text-xs">{stat.label}</p></div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Patients Grid (Radiology Tech) ===== */}
        {user?.role === 'radiology_tech' && patients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{t('radiologyPage.labels.radiologyPatients')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('radiologyPage.labels.clickToViewScans')}</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(patient => (
                <div key={patient.id} onClick={() => fetchPatientScans(patient)}
                  className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{patient.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email}</p>
                    <span className="inline-flex items-center mt-1 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium">
                      {t('radiologyPage.labels.scansCount', { count: scans.filter(s => s.patient_id === patient.id).length })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Scans List - Expandable Cards ===== */}
        {filteredScans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
            <div className="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CameraIcon className="w-10 h-10 text-cyan-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {user?.role === 'patient' && t('radiologyPage.empty.noScansPatient')}
              {user?.role === 'doctor' && t('radiologyPage.empty.noScansDoctor')}
              {user?.role === 'radiology_tech' && t('radiologyPage.empty.noScansTech')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredScans.map(scan => {
              const isExpanded = expandedScanId === scan.id;
              const statusColor = scan.status === 'completed' ? 'emerald' : scan.status === 'paid' ? 'blue' : scan.status === 'price_set' ? 'purple' : 'amber';

              return (
                <div key={scan.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                  isExpanded ? `border-${statusColor}-300 dark:border-${statusColor}-600 shadow-xl` : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'
                }`}>
                  <div className={`h-1.5 bg-gradient-to-r ${
                    scan.status === 'completed' ? 'from-emerald-400 via-teal-400 to-green-400' :
                    scan.status === 'paid' ? 'from-blue-400 via-indigo-400 to-purple-400' :
                    scan.status === 'price_set' ? 'from-purple-400 via-pink-400 to-rose-400' :
                    'from-amber-400 via-orange-400 to-yellow-400'
                  }`}></div>

                  {/* Collapsed Header */}
                  <button onClick={() => toggleExpand(scan.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${
                        isExpanded ? `bg-gradient-to-br from-${statusColor}-500 to-${statusColor}-600` :
                        `bg-gradient-to-br from-${statusColor}-100 to-${statusColor}-100 dark:from-${statusColor}-900/40 dark:to-${statusColor}-900/40`
                      }`}>
                        <span className="text-2xl">
                          {isExpanded ? '📂' : scan.status === 'completed' ? '✅' : scan.status === 'paid' ? '💳' : scan.status === 'price_set' ? '💰' : '⏳'}
                        </span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {user?.role === 'patient' ? scan.doctor_name : scan.patient_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-full font-medium">
                            📷 {scan.scan_type}
                          </span>
                          {getStatusBadge(scan)}
                          {scan.total_amount > 0 && (
                            <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full font-medium">
                              💰 {scan.total_amount} {t('radiologyPage.labels.currency')}
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

                  {/* Expanded Content */}
                  <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { icon: '👤', label: user?.role === 'patient' ? t('radiologyPage.labels.doctor') : t('radiologyPage.labels.patient'), value: user?.role === 'patient' ? scan.doctor_name : scan.patient_name },
                          { icon: '📷', label: t('radiologyPage.labels.scanType'), value: scan.scan_type },
                          { icon: '📍', label: t('radiologyPage.labels.bodyPart'), value: scan.body_part },
                        ].map((card, i) => (
                          <div key={i} className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800/30 text-center">
                            <span className="text-2xl mb-2 block">{card.icon}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{card.value}</p>
                          </div>
                        ))}
                      </div>

                      {scan.description && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>📝</span> {t('radiologyPage.labels.notes')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{scan.description}</p>
                        </div>
                      )}

                      {scan.result && scan.payment_status === 'paid' && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2"><span>📋</span> {t('radiologyPage.labels.report')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">{scan.result}</p>
                        </div>
                      )}

                      {scan.total_amount > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('radiologyPage.labels.price')}</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{scan.total_amount} {t('radiologyPage.labels.currency')}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => viewScanDetails(scan)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95">
                          <EyeIcon className="w-4 h-4" /> {t('radiologyPage.actions.details')}
                        </button>

                        {scan.result && scan.payment_status === 'paid' && (
                          <button onClick={() => getAIAnalysis(scan)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                            <SparklesIcon className="w-4 h-4" /> {t('radiologyPage.actions.aiAnalysis')}
                          </button>
                        )}

                        {user?.role === 'patient' && scan.status === 'price_set' && scan.total_amount > 0 && (
                          <button onClick={() => handlePayment(scan)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                            <CurrencyDollarIcon className="w-4 h-4" /> {t('radiologyPage.actions.pay', { amount: scan.total_amount })}
                          </button>
                        )}

                        {user?.role === 'radiology_tech' && scan.status === 'pending' && (
                          <button onClick={() => { setSelectedScan(scan); setShowPriceModal(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                            {t('radiologyPage.actions.setPrice')}
                          </button>
                        )}

                        {user?.role === 'radiology_tech' && (scan.status === 'paid' || scan.status === 'price_set') && (
                          <button onClick={() => { setSelectedScan(scan); setShowResultModal(true); setResultText(scan.result || ''); }} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                            {scan.result ? t('radiologyPage.actions.editReport') : t('radiologyPage.actions.addReport')}
                          </button>
                        )}

                        {user?.role === 'radiology_tech' && (
                          <button onClick={() => handleUploadFiles(scan)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                            <PhotoIcon className="w-4 h-4" /> {t('radiologyPage.actions.uploadFiles')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== All Modals ===== */}

      {/* Patient Scans Modal */}
      {showPatientScansModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientScansModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyPage.labels.patientScansTitle', { name: selectedPatient.username })}</h3>
              <button onClick={() => setShowPatientScansModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {patientScans.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <CameraIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{t('radiologyPage.messages.noScansForPatient')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('radiologyPage.labels.scansCountLabel', { count: patientScans.length })}</p>
                  {patientScans.map(scan => (
                    <div key={scan.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-cyan-600 dark:text-cyan-400">{scan.scan_type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📍 {scan.body_part}</p>
                          <p className="text-xs text-gray-400 mt-1">📅 {new Date(scan.created_at).toLocaleDateString('ar-EG')}</p>
                          {getStatusBadge(scan)}
                          {scan.total_amount > 0 && <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{t('radiologyPage.labels.amount', { amount: scan.total_amount })}</p>}
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

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('radiologyPage.labels.newRequestTitle')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelClass}>{t('radiologyPage.labels.patient')}</label><select className={inputClass} required value={requestData.patient_id} onChange={e => setRequestData({...requestData, patient_id: e.target.value})}><option value="">{t('radiologyPage.labels.selectPatient')}</option>{patients.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select></div>
              <div><label className={labelClass}>{t('radiologyPage.labels.radiologyDoctor')}</label><select className={inputClass} required value={requestData.radiology_tech_id} onChange={e => setRequestData({...requestData, radiology_tech_id: e.target.value})}><option value="">{t('radiologyPage.labels.select')}</option>{radiologyTechs.map(r => <option key={r.id} value={r.id}>{r.username}</option>)}</select></div>
              <div><label className={labelClass}>{t('radiologyPage.labels.scanType')}</label><select className={inputClass} required value={requestData.scan_type} onChange={e => setRequestData({...requestData, scan_type: e.target.value})}><option value="">{t('radiologyPage.labels.select')}</option>{scanTypes.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={labelClass}>{t('radiologyPage.labels.bodyPart')}</label><select className={inputClass} required value={requestData.body_part} onChange={e => setRequestData({...requestData, body_part: e.target.value})}><option value="">{t('radiologyPage.labels.select')}</option>{bodyParts.map(b => typeof b === 'string' ? <option key={b} value={b}>{t(`radiologyPage.defaultBodyParts.${b}`)}</option> : <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>{t('radiologyPage.labels.notes')}</label><textarea className={inputClass} placeholder={t('radiologyPage.labels.notesPlaceholder')} rows="3" value={requestData.description} onChange={e => setRequestData({...requestData, description: e.target.value})} /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/25 active:scale-95 transition-all">{t('radiologyPage.actions.sendRequest')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {showPriceModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('radiologyPage.labels.setPriceTitle')}</h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm text-gray-500">{t('radiologyPage.labels.patientLabel')} <span className="font-bold text-gray-800 dark:text-gray-100">{selectedScan.patient_name}</span></p>
                <p className="text-sm text-gray-500 mt-1">{t('radiologyPage.labels.scanInfoLabel')} <span className="font-bold text-gray-800 dark:text-gray-100">{selectedScan.scan_type} - {selectedScan.body_part}</span></p>
              </div>
              <div><label className={labelClass}>{t('radiologyPage.labels.priceWithCurrency')}</label><input type="number" className={inputClass} placeholder={t('radiologyPage.labels.enterPrice')} value={selectedScan.total_amount || 0} onChange={e => setSelectedScan({...selectedScan, total_amount: parseFloat(e.target.value)})} /></div>
              <button onClick={handleSetPrice} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">{t('radiologyPage.actions.confirmPrice')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResultModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedScan.result ? t('radiologyPage.labels.editReportTitle') : t('radiologyPage.labels.addReportTitle')}</h3>
              <button onClick={() => setShowResultModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-sm text-gray-500">{t('radiologyPage.labels.patientLabel')} <span className="font-bold">{selectedScan.patient_name}</span></p>
                <p className="text-sm text-gray-500">{t('radiologyPage.labels.scanInfoLabel')} <span className="font-bold">{selectedScan.scan_type} - {selectedScan.body_part}</span></p>
              </div>
              <button onClick={() => getAIAnalysis(selectedScan)} className="w-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-purple-200 dark:border-purple-800">
                <SparklesIcon className="w-4 h-4" /> {t('radiologyPage.actions.aiHelp')}
              </button>
              <textarea className={inputClass} rows="6" placeholder={t('radiologyPage.labels.reportPlaceholder')} value={resultText} onChange={e => setResultText(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleCompleteScan} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">{t('radiologyPage.actions.save')}</button>
                <button onClick={() => setShowResultModal(false)} className="px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('radiologyPage.actions.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('radiologyPage.labels.payTitle')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500">{t('radiologyPage.labels.scanType')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{selectedScan.scan_type} - {selectedScan.body_part}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center">
                <p className="text-sm text-gray-500">{t('radiologyPage.labels.totalAmount')}</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedScan.total_amount} {t('radiologyPage.labels.currency')}</p>
              </div>
              <div><label className={labelClass}>{t('radiologyPage.labels.paymentMethod')}</label><select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="cash">{t('radiologyPage.labels.cash')}</option><option value="card">{t('radiologyPage.labels.card')}</option><option value="wallet">{t('radiologyPage.labels.wallet')}</option></select></div>
              <button onClick={processPayment} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">{t('radiologyPage.actions.confirmPayment')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyPage.labels.scanDetailsTitle')}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[{ label: t('radiologyPage.labels.patient'), value: selectedScan.patient_name }, { label: t('radiologyPage.labels.doctor'), value: selectedScan.doctor_name }, { label: t('radiologyPage.labels.radiologyDoctor'), value: selectedScan.radiology_tech_name || t('radiologyPage.labels.notAssigned') }, { label: t('radiologyPage.labels.status'), value: null, badge: true }].map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    {item.badge ? getStatusBadge(selectedScan) : <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>}
                  </div>
                ))}
              </div>
              {selectedScan.description && <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-500 mb-1">{t('radiologyPage.labels.doctorNotes')}</p><p className="bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-700 dark:text-gray-300 text-sm">{selectedScan.description}</p></div>}
              {selectedScan.total_amount > 0 && <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center"><p className="text-sm text-gray-500">{t('radiologyPage.labels.price')}</p><p className="text-2xl font-bold text-green-600">{selectedScan.total_amount} {t('radiologyPage.labels.currency')}</p></div>}
              {selectedScan.result && selectedScan.payment_status === 'paid' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex justify-between items-center mb-2"><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t('radiologyPage.labels.radiologyReport')}</p><button onClick={() => getAIAnalysis(selectedScan)} className="text-purple-600 text-xs flex items-center gap-1 hover:text-purple-700"><SparklesIcon className="w-4 h-4" /> {t('radiologyPage.actions.aiAnalysis')}</button></div>
                  <p className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line border border-emerald-100 dark:border-emerald-800/30">{selectedScan.result}</p>
                </div>
              )}
              {scanImages.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('radiologyPage.labels.uploadedFiles', { count: scanImages.length })}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {scanImages.map((file, idx) => (
                      <div key={idx} className="relative group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30 hover:shadow-md transition-all">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2"><svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">{file.filename || 'PDF'}</p>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-500 hover:underline mt-1">{t('radiologyPage.labels.openPdf')}</a>
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

      {/* Upload Modal */}
      {showUploadModal && selectedScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('radiologyPage.labels.uploadTitle')}</h3>
              <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border-2 border-dashed border-cyan-300 dark:border-cyan-700 rounded-xl p-8 text-center hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors bg-cyan-50/50 dark:bg-cyan-900/10">
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/40 rounded-2xl flex items-center justify-center mb-3"><PhotoIcon className="w-8 h-8 text-cyan-500" /></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('radiologyPage.labels.clickToUpload')}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('radiologyPage.labels.fileTypes')}</span>
                </label>
              </div>
              {scanImages.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('radiologyPage.labels.files', { count: scanImages.length })}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {scanImages.map((file, idx) => (
                      <div key={idx} className="relative group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-1"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
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
              <button onClick={() => setShowUploadModal(false)} className="w-full py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('radiologyPage.actions.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAIModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> {t('radiologyPage.labels.aiAnalysisTitle')}</h3>
              <button onClick={() => setShowAIModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30 max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm">{aiAnalysis}</p>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all">{t('radiologyPage.actions.close')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RadiologyPage;