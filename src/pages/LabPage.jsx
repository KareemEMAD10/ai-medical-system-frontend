import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  BeakerIcon, PlusIcon, XMarkIcon, SparklesIcon, EyeIcon, 
  PhotoIcon, CurrencyDollarIcon, ChevronDownIcon, ArrowPathIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const LabPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [labTechs, setLabTechs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTestId, setExpandedTestId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPatientTestsModal, setShowPatientTestsModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTests, setPatientTests] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultText, setResultText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [testNames, setTestNames] = useState([]);
  const [testFiles, setTestFiles] = useState([]);
  const [testTypes, setTestTypes] = useState([]);

  const [requestData, setRequestData] = useState({
    patient_id: '', lab_tech_id: '', test_type: '', test_name: '', description: '', amount: 0
  });

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const toggleExpand = (id) => setExpandedTestId(expandedTestId === id ? null : id);

  const commonTestNames = [
    t('labPage.testNames.cbc'), t('labPage.testNames.hb'), t('labPage.testNames.creatinine'), t('labPage.testNames.urea'),
    t('labPage.testNames.fbs'), t('labPage.testNames.hba1c'), t('labPage.testNames.cholesterol'), t('labPage.testNames.triglycerides'),
    t('labPage.testNames.t3'), t('labPage.testNames.t4'), t('labPage.testNames.tsh'), t('labPage.testNames.vitamin_d'),
    t('labPage.testNames.ferritin'), t('labPage.testNames.iron'),
    t('labPage.testNames.urinalysis'), t('labPage.testNames.stool'), t('labPage.testNames.alt_ast'), t('labPage.testNames.crp')
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const testsRes = await api.get('/lab/requests').catch(() => ({ data: [] }));
      let patientsList = [];
      if (user?.role === 'doctor') {
        const res = await api.get('/doctors/my-patients').catch(() => ({ data: [] }));
        patientsList = res.data || [];
      } else if (user?.role === 'lab_tech') {
        const res = await api.get('/patients').catch(() => ({ data: [] }));
        patientsList = res.data || [];
      } else {
        const res = await api.get('/patients').catch(() => ({ data: [] }));
        patientsList = (res.data || []).filter(p => p.role === 'patient');
      }
      const typesRes = await api.get('/lab/test-types').catch(() => ({ data: [] }));
      const labTechsRes = await api.get('/users/by-role/lab_tech').catch(() => ({ data: [] }));
      const testsWithNames = (testsRes.data || []).map(test => {
        const patient = patientsList.find(p => p.id === test.patient_id);
        return { ...test, patient_name: patient?.username || test.patient_name || t('labPage.labels.patient'), doctor_name: test.doctor_name || t('labPage.labels.doctor') };
      });
      setTests(testsWithNames); setPatients(patientsList); setTestTypes(typesRes.data || []);
      setLabTechs(labTechsRes.data || []); setTestNames(commonTestNames);
    } catch (error) { toast.error(t('labPage.messages.loadError')); }
    finally { setIsLoading(false); }
  };

  const fetchPatientTests = (patient) => {
    const filteredTests = tests.filter(test => test.patient_id === patient.id);
    setSelectedPatient(patient); setPatientTests(filteredTests); setShowPatientTestsModal(true);
    if (filteredTests.length === 0) toast.info(t('labPage.messages.noTestsForPatient', { name: patient.username }));
  };

  const fetchTestFiles = async (testId) => {
    try {
      const response = await api.get(`/lab/requests/${testId}/files`);
      setTestFiles((response.data || []).map(file => ({ ...file, type: file.filename?.endsWith('.pdf') ? 'pdf' : 'image', url: `http://localhost:8000/uploads/lab/${testId}/${file.filename}` })));
    } catch (error) { setTestFiles([]); }
  };

  const getAIAnalysis = async (test) => {
    setSelectedTest(test); setShowAIModal(true); setAiAnalysis(t('labPage.messages.analyzing'));
    try {
      const response = await api.post('/ai/analyze-lab', { test_type: test.test_type, test_name: test.test_name, description: test.description, result: test.result });
      setAiAnalysis(response.data.analysis || response.data.result || t('labPage.messages.analysisSuccess'));
      toast.success(t('labPage.messages.analysisSuccess'));
    } catch (error) { setAiAnalysis(t('labPage.messages.analysisFailed')); }
  };

  const handlePayment = (test) => { setSelectedTest(test); setPaymentMethod('cash'); setShowPaymentModal(true); };

  const processPayment = async () => {
    if (!selectedTest) return;
    try {
      await api.post('/lab/payments', { test_id: selectedTest.id, amount: selectedTest.amount || 0, payment_method: paymentMethod, patient_id: user?.id });
      toast.success(t('labPage.messages.paymentSuccess', { amount: selectedTest.amount || 0 })); setShowPaymentModal(false); setSelectedTest(null); fetchData();
    } catch (error) { toast.error(error.response?.data?.detail || t('labPage.messages.paymentFailed')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.patient_id || !requestData.lab_tech_id || !requestData.test_type || !requestData.test_name) { toast.error(t('labPage.messages.completeAllData')); return; }
    try { await api.post('/lab/requests', requestData); toast.success(t('labPage.messages.submitSuccess')); setShowModal(false); setRequestData({ patient_id: '', lab_tech_id: '', test_type: '', test_name: '', description: '', amount: 0 }); fetchData(); }
    catch (error) { toast.error(error.response?.data?.detail || t('labPage.messages.submitFailed')); }
  };

  const handleCompleteTest = async () => {
    if (!resultText || !selectedTest?.id) { toast.error(t('labPage.messages.enterResult')); return; }
    try { await api.put(`/lab/requests/${selectedTest.id}/complete`, { result: resultText }); toast.success(t('labPage.messages.resultAdded')); setShowResultModal(false); setSelectedTest(null); setResultText(''); fetchData(); }
    catch (error) { toast.error(error.response?.data?.detail || t('labPage.messages.resultFailed')); }
  };

  const handleSetPrice = async () => {
    if (!selectedTest || selectedTest.amount <= 0) { toast.error(t('labPage.messages.enterValidPrice')); return; }
    try { await api.put(`/lab/requests/${selectedTest.id}/set-price`, { amount: selectedTest.amount }); toast.success(t('labPage.messages.priceSetSuccess')); setShowPriceModal(false); setSelectedTest(null); fetchData(); }
    catch (error) { toast.error(t('labPage.messages.priceSetFailed')); }
  };

  const handleUploadFiles = async (test) => { setSelectedTest(test); setUploadedFiles([]); await fetchTestFiles(test.id); setShowUploadModal(true); };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedTest?.id) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "application/pdf"];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) { toast.error(t('labPage.messages.unsupportedFiles')); return; }
    const formData = new FormData();
    files.forEach(f => formData.append("files", f)); formData.append("test_id", selectedTest.id);
    try { const response = await api.post("/lab/upload-files", formData, { headers: { "Content-Type": "multipart/form-data" } }); toast.success(t('labPage.messages.filesUploaded', { count: files.length })); await fetchTestFiles(selectedTest.id); setUploadedFiles([...uploadedFiles, ...(response.data.files || [])]); }
    catch (error) { toast.error(t('labPage.messages.fileUploadFailed')); }
  };

  const deleteFile = async (fileId) => {
    if (!selectedTest?.id) return;
    try { await api.delete(`/lab/files/${selectedTest.id}/${fileId}`); toast.success(t('labPage.messages.fileDeleted')); await fetchTestFiles(selectedTest.id); }
    catch (error) { toast.error(t('labPage.messages.fileDeleteFailed')); }
  };

  const viewTestDetails = async (test) => { setSelectedTest(test); await fetchTestFiles(test.id); setShowDetailsModal(true); };

  useEffect(() => { fetchData(); }, [user?.role]);

  if (isLoading) {
    return (<Layout><div className="flex flex-col items-center justify-center h-80 gap-4"><div className="relative"><div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 dark:border-teal-900"></div><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600 dark:border-teal-400 absolute top-0 left-0"></div></div><p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('labPage.labels.loading')}</p></div></Layout>);
  }

  const getStatusBadge = (test) => {
    const badges = {
      'completed': { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', text: t('labPage.labels.completed') },
      'paid': { cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: t('labPage.labels.paid') },
      'price_set': { cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800', text: t('labPage.labels.priced') },
    };
    const badge = badges[test.status] || { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', text: t('labPage.labels.pending') };
    return <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${badge.cls}`}>{badge.text}</span>;
  };

  const getStatusBarColor = (status) => ({
    'completed': 'from-emerald-400 via-teal-400 to-green-400',
    'paid': 'from-blue-400 via-indigo-400 to-purple-400',
    'price_set': 'from-purple-400 via-pink-400 to-rose-400',
  })[status] || 'from-amber-400 via-orange-400 to-yellow-400';

  const getStatusIcon = (status) => ({ 'completed': '✅', 'paid': '💳', 'price_set': '💰' })[status] || '⏳';

  const getExpandedBg = (status, isExpanded) => {
    const expanded = { 'completed': 'bg-gradient-to-br from-emerald-500 to-teal-600', 'paid': 'bg-gradient-to-br from-blue-500 to-indigo-600', 'price_set': 'bg-gradient-to-br from-purple-500 to-pink-600' };
    const collapsed = { 'completed': 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40', 'paid': 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40', 'price_set': 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40' };
    if (isExpanded) return expanded[status] || 'bg-gradient-to-br from-amber-500 to-orange-600';
    return collapsed[status] || 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40';
  };

  const filteredTests = (() => {
    if (!tests) return [];
    if (user?.role === 'lab_tech') return tests.filter(t => t.status === 'pending' || t.status === 'price_set' || t.status === 'paid');
    if (user?.role === 'patient') return tests.filter(t => t.patient_id === user.id);
    if (user?.role === 'doctor') return tests.filter(t => t.doctor_id === user.id);
    return tests;
  })();

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-500 dark:from-teal-900 dark:via-emerald-900 dark:to-cyan-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>
          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20"><span className="text-4xl">🔬</span></div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t('labPage.labels.title')}</h1>
                <p className="text-teal-100 mt-2 text-base">
                  {user?.role === 'doctor' && t('labPage.labels.subtitleDoctor')}
                  {user?.role === 'lab_tech' && t('labPage.labels.subtitleLabTech')}
                  {user?.role === 'patient' && t('labPage.labels.subtitlePatient')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user?.role === 'doctor' && (
                <button onClick={() => setShowModal(true)} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                  <PlusIcon className="w-5 h-5" /> {t('labPage.actions.newTest')}
                </button>
              )}
              <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('labPage.actions.refresh')}
              </button>
            </div>
          </div>

          {/* Admin Stats */}
          {user?.role === 'admin' && (
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: t('labPage.labels.statPending'), count: tests.filter(t => t.status === 'pending').length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
                { label: t('labPage.labels.statPriced'), count: tests.filter(t => t.status === 'price_set').length, icon: '💰', color: 'from-purple-400/20 to-purple-500/20' },
                { label: t('labPage.labels.statCompleted'), count: tests.filter(t => t.status === 'completed').length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
                { label: t('labPage.labels.statRevenue'), count: `${tests.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0)} ${t('labPage.labels.currency')}`, icon: '💵', color: 'from-blue-400/20 to-blue-500/20' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10`}>
                  <div className="flex items-center gap-3"><span className="text-2xl">{stat.icon}</span><div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-white/70 text-xs">{stat.label}</p></div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Patients Grid (Lab Tech) ===== */}
        {user?.role === 'lab_tech' && patients.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">{t('labPage.labels.labPatients')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('labPage.labels.labPatientsHint')}</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(patient => {
                const count = tests.filter(t => t.patient_id === patient.id).length;
                return (
                  <div key={patient.id} onClick={() => fetchPatientTests(patient)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{patient.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email}</p>
                        <span className="inline-flex items-center mt-1 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">
                          🔬 {count} {t('labPage.labels.testCount')}
                        </span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Tests List - Expandable Cards ===== */}
        {filteredTests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
            <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BeakerIcon className="w-10 h-10 text-teal-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {user?.role === 'patient' && t('labPage.empty.noTestsPatient')}
              {user?.role === 'doctor' && t('labPage.empty.noTestsDoctor')}
              {user?.role === 'lab_tech' && t('labPage.empty.noTestsLabTech')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTests.map(test => {
              const isExpanded = expandedTestId === test.id;
              return (
                <div key={test.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                  isExpanded ? 'border-teal-300 dark:border-teal-600 shadow-xl shadow-teal-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'
                }`}>
                  <div className={`h-1.5 bg-gradient-to-r ${getStatusBarColor(test.status)}`}></div>

                  {/* Collapsed Header */}
                  <button onClick={() => toggleExpand(test.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${getExpandedBg(test.status, isExpanded)}`}>
                        <span className="text-2xl">{isExpanded ? '📂' : getStatusIcon(test.status)}</span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {user?.role === 'patient' ? test.doctor_name : test.patient_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-full font-medium">
                            🔬 {test.test_name}
                          </span>
                          {getStatusBadge(test)}
                          {test.amount > 0 && (
                            <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full font-medium">
                              💰 {test.amount} {t('labPage.labels.currency')}
                            </span>
                          )}
                          {test.status === 'pending' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                      isExpanded ? 'bg-teal-100 dark:bg-teal-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-4">
                      {/* Info Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { icon: '👤', label: user?.role === 'patient' ? t('labPage.labels.doctor') : t('labPage.labels.patient'), value: user?.role === 'patient' ? test.doctor_name : test.patient_name },
                          { icon: '🔬', label: t('labPage.labels.testName'), value: test.test_name },
                          { icon: '📋', label: t('labPage.labels.testType'), value: test.test_type },
                        ].map((card, i) => (
                          <div key={i} className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800/30 text-center">
                            <span className="text-2xl mb-2 block">{card.icon}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{card.value}</p>
                          </div>
                        ))}
                      </div>

                      {test.description && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>📝</span> {t('labPage.labels.notes')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{test.description}</p>
                        </div>
                      )}

                      {test.amount > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center">
                          <p className="text-sm text-gray-500">{t('labPage.labels.price')}</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{test.amount} {t('labPage.labels.currency')}</p>
                        </div>
                      )}

                      {test.result && test.payment_status === 'paid' && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2"><span>📋</span> {t('labPage.labels.result')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 whitespace-pre-line">{test.result}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => viewTestDetails(test)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95">
                          <EyeIcon className="w-4 h-4" /> {t('labPage.actions.details')}
                        </button>

                        {test.result && test.payment_status === 'paid' && (
                          <button onClick={() => getAIAnalysis(test)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                            <SparklesIcon className="w-4 h-4" /> {t('labPage.actions.aiAnalysis')}
                          </button>
                        )}

                        {user?.role === 'patient' && test.status === 'price_set' && test.amount > 0 && (
                          <button onClick={() => handlePayment(test)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                            <CurrencyDollarIcon className="w-4 h-4" /> {t('labPage.actions.pay', { amount: test.amount })}
                          </button>
                        )}

                        {user?.role === 'lab_tech' && test.status === 'pending' && (
                          <button onClick={() => { setSelectedTest(test); setShowPriceModal(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                            {t('labPage.actions.setPrice')}
                          </button>
                        )}

                        {user?.role === 'lab_tech' && (test.status === 'paid' || test.status === 'price_set') && (
                          <button onClick={() => { setSelectedTest(test); setShowResultModal(true); setResultText(test.result || ''); }} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                            {test.result ? t('labPage.actions.editResult') : t('labPage.actions.addResult')}
                          </button>
                        )}

                        {user?.role === 'lab_tech' && (
                          <button onClick={() => handleUploadFiles(test)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all">
                            <PhotoIcon className="w-4 h-4" /> {t('labPage.actions.uploadFiles')}
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

      {/* ===== MODALS ===== */}

      {/* Patient Tests Modal */}
      {showPatientTestsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientTestsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('labPage.labels.patientTestsTitle', { name: selectedPatient.username })}</h3>
              <button onClick={() => setShowPatientTestsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {patientTests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><BeakerIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" /><p className="text-gray-500 dark:text-gray-400">{t('labPage.labels.noTests')}</p></div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">{t('labPage.labels.testCountLabel', { count: patientTests.length })}</p>
                  {patientTests.map(test => (
                    <div key={test.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-teal-600 dark:text-teal-400">{test.test_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📋 {test.test_type}</p>
                          <p className="text-xs text-gray-400 mt-1">📅 {new Date(test.created_at).toLocaleDateString('ar-EG')}</p>
                          <div className="mt-2">{getStatusBadge(test)}</div>
                          {test.amount > 0 && <p className="text-sm font-bold text-green-600 mt-1">💰 {test.amount} {t('labPage.labels.currency')}</p>}
                        </div>
                        <button onClick={() => { setShowPatientTestsModal(false); viewTestDetails(test); }} className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
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
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('labPage.labels.newRequest')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelClass}>{t('labPage.labels.patient')}</label><select className={inputClass} required value={requestData.patient_id} onChange={e => setRequestData({...requestData, patient_id: e.target.value})}><option value="">{t('labPage.labels.patientSelect')}</option>{patients.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select></div>
              <div><label className={labelClass}>{t('labPage.labels.labTechSelect')}</label><select className={inputClass} required value={requestData.lab_tech_id} onChange={e => setRequestData({...requestData, lab_tech_id: e.target.value})}><option value="">{t('labPage.labels.select')}</option>{labTechs.map(l => <option key={l.id} value={l.id}>{l.username}</option>)}</select></div>
              <div><label className={labelClass}>{t('labPage.labels.testType')}</label><select className={inputClass} required value={requestData.test_type} onChange={e => setRequestData({...requestData, test_type: e.target.value})}><option value="">{t('labPage.labels.select')}</option>{testTypes.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={labelClass}>{t('labPage.labels.testName')}</label><select className={inputClass} required value={requestData.test_name} onChange={e => setRequestData({...requestData, test_name: e.target.value})}><option value="">{t('labPage.labels.select')}</option>{testNames.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={labelClass}>{t('labPage.labels.notes')}</label><textarea className={inputClass} placeholder={t('labPage.labels.notesPlaceholder')} rows="3" value={requestData.description} onChange={e => setRequestData({...requestData, description: e.target.value})} /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-500/25 active:scale-95 transition-all">{t('labPage.actions.submit')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {showPriceModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPriceModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('labPage.labels.priceModalTitle')}</h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm text-gray-500">{t('labPage.labels.patientInfo')}<span className="font-bold">{selectedTest.patient_name}</span></p>
                <p className="text-sm text-gray-500 mt-1">{t('labPage.labels.testInfoLabel')}<span className="font-bold">{selectedTest.test_type} - {selectedTest.test_name}</span></p>
              </div>
              <div><label className={labelClass}>{t('labPage.labels.priceInput')}</label><input type="number" className={inputClass} placeholder={t('labPage.labels.pricePlaceholder')} value={selectedTest.amount || 0} onChange={e => setSelectedTest({...selectedTest, amount: parseFloat(e.target.value)})} /></div>
              <button onClick={handleSetPrice} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all">{t('labPage.actions.confirmSetPrice')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResultModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedTest.result ? t('labPage.labels.editResultTitle') : t('labPage.labels.addResultTitle')}</h3>
              <button onClick={() => setShowResultModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-sm text-gray-500">{t('labPage.labels.patientInfo')}<span className="font-bold">{selectedTest.patient_name}</span></p>
                <p className="text-sm text-gray-500">{t('labPage.labels.testInfoLabel')}<span className="font-bold">{selectedTest.test_type} - {selectedTest.test_name}</span></p>
              </div>
              <button onClick={() => getAIAnalysis(selectedTest)} className="w-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-purple-200 dark:border-purple-800">
                <SparklesIcon className="w-4 h-4" /> {t('labPage.labels.aiHelp')}
              </button>
              <textarea className={inputClass} rows="6" placeholder={t('labPage.labels.resultPlaceholder')} value={resultText} onChange={e => setResultText(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleCompleteTest} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">{t('labPage.labels.save')}</button>
                <button onClick={() => setShowResultModal(false)} className="px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('labPage.labels.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('labPage.labels.payTitle')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-500">{t('labPage.labels.testInfo')}</p><p className="font-bold text-gray-800 dark:text-gray-100">{selectedTest.test_type} - {selectedTest.test_name}</p></div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30 text-center"><p className="text-sm text-gray-500">{t('labPage.labels.amountDue')}</p><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedTest.amount || 0} {t('labPage.labels.currency')}</p></div>
              <div><label className={labelClass}>{t('labPage.labels.paymentMethod')}</label><select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="cash">{t('labPage.labels.cash')}</option><option value="card">{t('labPage.labels.card')}</option><option value="wallet">{t('labPage.labels.wallet')}</option></select></div>
              <button onClick={processPayment} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">{t('labPage.actions.confirmPayment')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('labPage.labels.detailsTitle')}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[{ label: t('labPage.labels.patient'), value: selectedTest.patient_name }, { label: t('labPage.labels.doctor'), value: selectedTest.doctor_name }, { label: t('labPage.labels.testName'), value: selectedTest.test_name }, { label: t('labPage.labels.testType'), value: selectedTest.test_type }].map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2"><span className="text-sm text-gray-500">{t('labPage.labels.status')}:</span> {getStatusBadge(selectedTest)}</div>
              {selectedTest.description && <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-500 mb-1">{t('labPage.labels.notes')}</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedTest.description}</p></div>}
              {selectedTest.amount > 0 && <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30 text-center"><p className="text-sm text-gray-500">{t('labPage.labels.price')}</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedTest.amount} {t('labPage.labels.currency')}</p></div>}
              {selectedTest.result && selectedTest.payment_status === 'paid' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex justify-between items-center mb-2"><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t('labPage.labels.result')}</p><button onClick={() => getAIAnalysis(selectedTest)} className="text-purple-600 text-xs flex items-center gap-1 hover:text-purple-700"><SparklesIcon className="w-4 h-4" /> {t('labPage.actions.aiAnalysis')}</button></div>
                  <p className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line border border-emerald-100 dark:border-emerald-800/30">{selectedTest.result}</p>
                </div>
              )}
              {testFiles.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('labPage.labels.filesCount', { count: testFiles.length })}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {testFiles.map((file, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2"><svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">{file.filename}</p>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-500 hover:underline mt-1">{t('labPage.labels.openPdf')}</a>
                          </div>
                        ) : <img src={file.url} alt={`file-${idx}`} className="w-full h-32 object-cover" />}
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
      {showUploadModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('labPage.labels.uploadTitle')}</h3>
              <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl p-8 text-center hover:border-teal-500 transition-colors bg-teal-50/50 dark:bg-teal-900/10">
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" id="labpage-file-upload" />
                <label htmlFor="labpage-file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center mb-3"><PhotoIcon className="w-8 h-8 text-teal-500" /></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('labPage.labels.uploadHint')}</span>
                  <span className="text-xs text-gray-400 mt-1">{t('labPage.labels.uploadFormats')}</span>
                </label>
              </div>
              {testFiles.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('labPage.labels.uploadFilesLabel', { count: testFiles.length })}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {testFiles.map((file, idx) => (
                      <div key={idx} className="relative group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700/30">
                        {file.type === 'pdf' ? (
                          <div className="aspect-square flex flex-col items-center justify-center p-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-1"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">{file.filename}</p>
                          </div>
                        ) : <img src={file.url} alt={`file-${idx}`} className="w-full h-24 object-cover" />}
                        <button onClick={() => deleteFile(file.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowUploadModal(false)} className="w-full py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('labPage.labels.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAIModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> {t('labPage.labels.aiTitle')}</h3>
              <button onClick={() => setShowAIModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30 max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm">{aiAnalysis}</p>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all">{t('labPage.labels.close')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LabPage;