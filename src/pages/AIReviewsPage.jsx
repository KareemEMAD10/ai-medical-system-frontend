import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CpuChipIcon, SparklesIcon, DocumentTextIcon, 
  UserCircleIcon, EyeIcon, ArrowPathIcon, XMarkIcon,
  CheckCircleIcon, ClockIcon, ChatBubbleLeftRightIcon,
  PencilIcon, TrashIcon, PlusIcon, ClipboardDocumentIcon,
  BeakerIcon, CameraIcon, ChevronDownIcon, PhotoIcon
} from '@heroicons/react/24/outline';

const useNetworkStatus = (t) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success(t('aiReviewsPage.messages.connection_restored'));
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error(t('aiReviewsPage.messages.connection_lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, t]);

  return { isOnline, wasOffline };
};

const AIReviewsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus(t);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editResponse, setEditResponse] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [availableSources, setAvailableSources] = useState({
    medical_records: [],
    lab_results: [],
    radiology_results: [],
    prescriptions: []
  });
  const [selectedSourceType, setSelectedSourceType] = useState('medical_record');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestPriority, setRequestPriority] = useState('normal');
  const [approveData, setApproveData] = useState({
    approve: true,
    doctor_notes: '',
    rejection_reason: '',
    suggested_response: ''
  });
  
  const [abortController, setAbortController] = useState(null);

  const [sourceDetails, setSourceDetails] = useState(null);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [previewSourceDetails, setPreviewSourceDetails] = useState(null);
  const [previewSourceFiles, setPreviewSourceFiles] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchData = async () => {
    if (abortController) {
      abortController.abort();
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsLoading(true);
    try {
      if (user?.role === 'patient') {
        const [requestsRes, sourcesRes] = await Promise.all([
          api.get('/ai/reviews/my-requests', { signal: controller.signal }),
          api.get('/ai/available-sources', { signal: controller.signal })
        ]);
        setMyRequests(requestsRes.data || []);
        setAvailableSources(sourcesRes.data || { medical_records: [], lab_results: [], radiology_results: [], prescriptions: [] });
      } else if (user?.role === 'doctor') {
        const [pendingRes, myRes] = await Promise.all([
          api.get('/ai/reviews/pending', { signal: controller.signal }),
          api.get('/ai/reviews/my-requests', { signal: controller.signal })
        ]);
        setPendingReviews(pendingRes.data || []);
        setMyRequests(myRes.data || []);
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Request cancelled');
        return;
      }
      
      if (error.isNetworkError) {
        console.warn('⚠️ Network error, keeping existing data');
        setMyRequests([]);
        setPendingReviews([]);
        return;
      }
      
      console.error('Error:', error);
      toast.error(t('aiReviewsPage.messages.load_failed'));
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const fetchSuggestedAnalysis = async (reviewId) => {
    try {
      const res = await api.get(`/ai/reviews/${reviewId}/suggested-analysis`);
      return res.data;
    } catch (error) {
      return null;
    }
  };

  const fetchSourceDetails = async (sourceType, sourceId) => {
    setIsLoadingDetails(true);
    setSourceDetails(null);
    setSourceFiles([]);
    
    try {
      let details = null;
      let files = [];
      
      switch (sourceType) {
        case 'medical_record':
          const recordRes = await api.get(`/patients/medical-records/${sourceId}`);
          details = recordRes.data;
          break;
          
        case 'lab':
          const labRes = await api.get(`/lab/requests/${sourceId}`);
          details = labRes.data;
          try {
            const filesRes = await api.get(`/lab/requests/${sourceId}/files`);
            files = filesRes.data || [];
          } catch (e) {}
          break;
          
        case 'radiology':
          const radRes = await api.get(`/radiology/requests/${sourceId}`);
          details = radRes.data;
          try {
            const filesRes = await api.get(`/radiology/requests/${sourceId}/images`);
            files = filesRes.data || [];
          } catch (e) {}
          break;
          
        case 'prescription':
          const pharmRes = await api.get(`/pharmacy/prescriptions/${sourceId}`);
          details = pharmRes.data;
          break;
          
        default:
          details = { id: sourceId, name: t('aiReviewsPage.labels.unknown_source') };
      }
      
      setSourceDetails(details);
      setSourceFiles(files);
      
    } catch (error) {
      console.error('Error fetching source details:', error);
      toast.error(t('aiReviewsPage.messages.source_details_failed'));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchPreviewSourceDetails = async (sourceType, sourceId) => {
    if (!sourceId) {
      setPreviewSourceDetails(null);
      setPreviewSourceFiles([]);
      return;
    }
    
    setIsLoadingPreview(true);
    setPreviewSourceDetails(null);
    setPreviewSourceFiles([]);
    
    try {
      let details = null;
      let files = [];
      
      switch (sourceType) {
        case 'medical_record':
          const recordRes = await api.get(`/patients/medical-records/${sourceId}`);
          details = recordRes.data;
          break;
          
        case 'lab':
          const labRes = await api.get(`/lab/requests/${sourceId}`);
          details = labRes.data;
          try {
            const filesRes = await api.get(`/lab/requests/${sourceId}/files`);
            files = filesRes.data || [];
          } catch (e) {}
          break;
          
        case 'radiology':
          const radRes = await api.get(`/radiology/requests/${sourceId}`);
          details = radRes.data;
          try {
            const filesRes = await api.get(`/radiology/requests/${sourceId}/images`);
            files = filesRes.data || [];
          } catch (e) {}
          break;
          
        case 'prescription':
          const pharmRes = await api.get(`/pharmacy/prescriptions/${sourceId}`);
          details = pharmRes.data;
          break;
          
        default:
          details = { id: sourceId, name: t('aiReviewsPage.labels.unknown_source') };
      }
      
      setPreviewSourceDetails(details);
      setPreviewSourceFiles(files);
      
    } catch (error) {
      console.error('Error fetching preview details:', error);
      toast.error(t('aiReviewsPage.messages.source_details_failed'));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (selectedSourceId && selectedSourceType) {
      fetchPreviewSourceDetails(selectedSourceType, selectedSourceId);
    } else {
      setPreviewSourceDetails(null);
      setPreviewSourceFiles([]);
    }
  }, [selectedSourceId, selectedSourceType]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [user]);

  const handleSubmitNewRequest = async () => {
    if (!selectedSourceId) { toast.error(t('aiReviewsPage.messages.select_source_required')); return; }
    if (!requestReason.trim() || requestReason.length < 10) { toast.error(t('aiReviewsPage.messages.reason_required')); return; }
    
    if (!navigator.onLine) {
      toast.error(t('aiReviewsPage.messages.no_internet'));
      return;
    }
    
    try {
      await api.post('/ai/reviews/request', {
        source_type: selectedSourceType,
        source_id: parseInt(selectedSourceId),
        request_reason: requestReason,
        priority: requestPriority
      });
      toast.success(t('aiReviewsPage.messages.request_sent'));
      setShowNewRequestModal(false);
      setSelectedSourceId('');
      setRequestReason('');
      setRequestPriority('normal');
      fetchData();
    } catch (error) {
      if (error.isNetworkError) {
        toast.error(t('aiReviewsPage.messages.network_error_retry'));
        return;
      }
      toast.error(error.response?.data?.detail || t('aiReviewsPage.messages.request_failed'));
    }
  };

  const handleViewRequest = async (request) => {
    if (!navigator.onLine) {
      toast.error(t('aiReviewsPage.messages.no_internet'));
      return;
    }
    
    try {
      const res = await api.get(`/ai/reviews/${request.id}`);
      setSelectedRequest(res.data);
      setShowDetailsModal(true);
      
      await fetchSourceDetails(request.source_type, request.source_id);
      
    } catch (error) {
      if (error.isNetworkError) {
        toast.error(t('aiReviewsPage.messages.network_error'));
        return;
      }
      toast.error(t('aiReviewsPage.messages.load_details_failed'));
    }
  };

  const openApproveModal = async (request) => {
    if (!navigator.onLine) {
      toast.error(t('aiReviewsPage.messages.no_internet'));
      return;
    }
    
    setSelectedRequest(request);
    setApproveData({ approve: true, doctor_notes: '', rejection_reason: '', suggested_response: '' });
    setShowApproveModal(true);
    const suggested = await fetchSuggestedAnalysis(request.id);
    if (suggested?.suggested_response) {
      setApproveData(prev => ({ ...prev, suggested_response: suggested.suggested_response }));
    }
  };

  const openEditModal = (request) => {
    setSelectedRequest(request);
    setEditResponse(request.ai_response || '');
    setShowEditModal(true);
  };

  const handleApproveReject = async () => {
    try {
      if (!approveData.approve && !approveData.rejection_reason.trim()) { 
        toast.error(t('aiReviewsPage.messages.rejection_reason_required')); 
        return; 
      }
      
      if (!navigator.onLine) {
        toast.error(t('aiReviewsPage.messages.no_internet'));
        return;
      }
      
      const response = await api.post(`/ai/reviews/${selectedRequest.id}/approve`, {
        approve: approveData.approve,
        doctor_notes: approveData.doctor_notes,
        rejection_reason: approveData.rejection_reason
      });
      toast.success(approveData.approve ? t('aiReviewsPage.messages.approve_success') : t('aiReviewsPage.messages.reject_success'));
      setShowApproveModal(false);
      fetchData();
      if (approveData.approve && response.data.ai_response) {
        setTimeout(() => {
          setSelectedRequest({ ...selectedRequest, ai_response: response.data.ai_response, status: 'completed' });
          setShowDetailsModal(true);
        }, 1000);
      }
    } catch (error) {
      if (error.isNetworkError) {
        toast.error(t('aiReviewsPage.messages.network_error_retry'));
        return;
      }
      toast.error(error.response?.data?.detail || t('aiReviewsPage.messages.error_occurred'));
    }
  };

  const handleEditResponse = async () => {
    if (!editResponse.trim()) { toast.error(t('aiReviewsPage.messages.edit_response_required')); return; }
    
    if (!navigator.onLine) {
      toast.error(t('aiReviewsPage.messages.no_internet'));
      return;
    }
    
    try {
      await api.put(`/ai/reviews/${selectedRequest.id}/edit`, { ai_response: editResponse });
      toast.success(t('aiReviewsPage.messages.edit_success'));
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      if (error.isNetworkError) {
        toast.error(t('aiReviewsPage.messages.network_error'));
        return;
      }
      toast.error(t('aiReviewsPage.messages.edit_failed'));
    }
  };

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'medical_record': return <DocumentTextIcon className="w-4 h-4" />;
      case 'lab': return <BeakerIcon className="w-4 h-4" />;
      case 'radiology': return <CameraIcon className="w-4 h-4" />;
      case 'prescription': return <ClipboardDocumentIcon className="w-4 h-4" />;
      default: return <ClipboardDocumentIcon className="w-4 h-4" />;
    }
  };

  const getSourceTypeText = (sourceType) => {
    const map = { medical_record: t('aiReviewsPage.labels.source_type_medical_record'), lab: t('aiReviewsPage.labels.source_type_lab'), radiology: t('aiReviewsPage.labels.source_type_radiology'), prescription: t('aiReviewsPage.labels.source_type_prescription') };
    return map[sourceType] || t('aiReviewsPage.labels.source_type_unknown');
  };

  const getStatusBadge = (status) => {
    const config = {
      'pending_doctor': { text: t('aiReviewsPage.status.pending_doctor'), cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
      'approved':       { text: t('aiReviewsPage.status.approved'), cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
      'completed':      { text: t('aiReviewsPage.status.completed'), cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
      'rejected':       { text: t('aiReviewsPage.status.rejected'), cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
    };
    const c = config[status] || config['pending_doctor'];
    return <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${c.cls}`}>{c.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const config = {
      'low':    { text: t('aiReviewsPage.status.priority_low'), cls: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
      'normal': { text: t('aiReviewsPage.status.priority_normal'), cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
      'high':   { text: t('aiReviewsPage.status.priority_high'), cls: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
      'urgent': { text: t('aiReviewsPage.status.priority_urgent'), cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
    };
    const c = config[priority] || config['normal'];
    return <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${c.cls}`}>{c.text}</span>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-EG');
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 dark:border-purple-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 dark:border-purple-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('aiReviewsPage.labels.loading_data')}</p>
        </div>
      </Layout>
    );
  }

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const doctorTabs = [
    { id: 'pending', label: t('aiReviewsPage.labels.tab_pending'), count: pendingReviews.length, icon: '⏳' },
    { id: 'history', label: t('aiReviewsPage.labels.tab_history'), count: myRequests.length, icon: '📋' },
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {!isOnline && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-center">
            <p className="text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2">
              <span className="text-xl">⚠️</span> {t('aiReviewsPage.labels.offline_banner')}
            </p>
            <p className="text-sm text-red-500 dark:text-red-300 mt-1">{t('aiReviewsPage.labels.offline_subtitle')}</p>
          </div>
        )}

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>

          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <CpuChipIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                  {user?.role === 'patient' ? t('aiReviewsPage.labels.page_title_patient') : t('aiReviewsPage.labels.page_title_doctor')}
                </h1>
                <p className="text-purple-100 mt-2 text-base max-w-lg">
                  {user?.role === 'patient'
                    ? t('aiReviewsPage.labels.page_subtitle_patient')
                    : t('aiReviewsPage.labels.page_subtitle_doctor')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user?.role === 'patient' && (
                <button onClick={() => setShowNewRequestModal(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
                  <PlusIcon className="w-5 h-5" /> {t('aiReviewsPage.actions.new_ai_request')}
                </button>
              )}
              <button onClick={fetchData}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('aiReviewsPage.actions.refresh')}
              </button>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {user?.role === 'doctor' ? [
              { label: t('aiReviewsPage.labels.stat_pending'), count: pendingReviews.length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
              { label: t('aiReviewsPage.labels.stat_completed'), count: myRequests.filter(r => r.status === 'completed').length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('aiReviewsPage.labels.stat_rejected'), count: myRequests.filter(r => r.status === 'rejected').length, icon: '❌', color: 'from-red-400/20 to-red-500/20' },
              { label: t('aiReviewsPage.labels.stat_all'), count: myRequests.length + pendingReviews.length, icon: '📋', color: 'from-blue-400/20 to-blue-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-white/70 text-xs">{stat.label}</p></div>
                </div>
              </div>
            )) : [
              { label: t('aiReviewsPage.labels.stat_my_total'), count: myRequests.length, icon: '📋', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('aiReviewsPage.labels.stat_under_review'), count: myRequests.filter(r => r.status === 'pending_doctor').length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
              { label: t('aiReviewsPage.labels.stat_completed'), count: myRequests.filter(r => r.status === 'completed').length, icon: '✅', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('aiReviewsPage.labels.stat_rejected'), count: myRequests.filter(r => r.status === 'rejected').length, icon: '❌', color: 'from-red-400/20 to-red-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-white/70 text-xs">{stat.label}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {user?.role === 'doctor' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2">
            <div className="flex gap-1">
              {doctorTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
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
        )}

        {user?.role === 'doctor' && activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingReviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-10 h-10 text-amber-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('aiReviewsPage.empty.no_pending')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('aiReviewsPage.empty.no_pending_subtitle')}</p>
              </div>
            ) : (
              pendingReviews.map(req => {
                const isExpanded = expandedId === req.id;
                return (
                  <div key={req.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-purple-300 dark:border-purple-600 shadow-xl shadow-purple-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'}`}>
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>

                    <button onClick={() => toggleExpand(req.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${isExpanded ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40'}`}>
                          <span className="text-2xl">{isExpanded ? '📂' : '⏳'}</span>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-gray-400" />
                            {req.patient_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                              {getSourceIcon(req.source_type)} {getSourceTypeText(req.source_type)}
                            </span>
                            {getPriorityBadge(req.priority)}
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${isExpanded ? 'bg-purple-100 dark:bg-purple-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                      <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>💬</span> {t('aiReviewsPage.labels.request_reason')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">{req.request_reason}</p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">📅 {formatDate(req.created_at)}</p>
                        <div className="flex gap-3">
                          <button onClick={() => handleViewRequest(req)} className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95">
                            <EyeIcon className="w-4 h-4" /> {t('aiReviewsPage.actions.view_details')}
                          </button>
                          <button onClick={() => openApproveModal(req)} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
                            <CheckCircleIcon className="w-4 h-4" /> {t('aiReviewsPage.actions.process_request')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {(user?.role === 'patient' || (user?.role === 'doctor' && activeTab === 'history')) && (
          <div className="space-y-3">
            {user?.role === 'patient' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-purple-500" /> {t('aiReviewsPage.labels.my_previous_requests')}
                </h2>
              </div>
            )}

            {myRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('aiReviewsPage.empty.no_requests')}</p>
                {user?.role === 'patient' && (
                  <button onClick={() => setShowNewRequestModal(true)} className="mt-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                    {t('aiReviewsPage.actions.new_ai_request')}
                  </button>
                )}
              </div>
            ) : (
              myRequests.map(req => {
                const isExpanded = expandedId === req.id;
                const statusColor = req.status === 'completed' ? 'from-emerald-400 via-teal-400 to-green-400' : req.status === 'rejected' ? 'from-red-400 via-rose-400 to-pink-400' : req.status === 'approved' ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-amber-400 via-orange-400 to-yellow-400';
                const avatarExpanded = req.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : req.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-rose-600' : req.status === 'approved' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-500 to-orange-600';
                const avatarCollapsed = req.status === 'completed' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40' : req.status === 'rejected' ? 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40' : req.status === 'approved' ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40' : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40';

                return (
                  <div key={req.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-purple-300 dark:border-purple-600 shadow-xl shadow-purple-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'}`}>
                    <div className={`h-1.5 bg-gradient-to-r ${statusColor}`}></div>

                    <button onClick={() => toggleExpand(req.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${isExpanded ? avatarExpanded : avatarCollapsed}`}>
                          <span className="text-2xl">
                            {isExpanded ? '📂' : req.status === 'completed' ? '✅' : req.status === 'rejected' ? '❌' : req.status === 'approved' ? '🔄' : '⏳'}
                          </span>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                            {user?.role === 'doctor' ? req.patient_name : `${t('aiReviewsPage.labels.doctor_title_prefix')}${req.doctor_name}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                              {getSourceIcon(req.source_type)} {getSourceTypeText(req.source_type)}
                            </span>
                            {getPriorityBadge(req.priority)}
                            {getStatusBadge(req.status)}
                          </div>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${isExpanded ? 'bg-purple-100 dark:bg-purple-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                      <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-5">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { icon: '👤', label: user?.role === 'doctor' ? t('aiReviewsPage.labels.patient') : t('aiReviewsPage.labels.doctor'), value: user?.role === 'doctor' ? req.patient_name : `${t('aiReviewsPage.labels.doctor_title_prefix')}${req.doctor_name}`, bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
                            { icon: '📋', label: t('aiReviewsPage.labels.source_type'), value: getSourceTypeText(req.source_type), bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
                            { icon: '📅', label: t('aiReviewsPage.labels.request_date'), value: formatDate(req.created_at), bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
                          ].map((card, i) => (
                            <div key={i} className={`bg-gradient-to-r ${card.bg} rounded-xl p-4 border ${card.border} text-center`}>
                              <span className="text-2xl mb-2 block">{card.icon}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                              <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-sm">{card.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><span>💬</span> {t('aiReviewsPage.labels.request_reason')}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">{req.request_reason}</p>
                        </div>

                        {req.doctor_notes && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2"><span>📝</span> {t('aiReviewsPage.labels.doctor_notes')}</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{req.doctor_notes}</p>
                          </div>
                        )}

                        {req.rejection_reason && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
                            <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2"><span>❌</span> {t('aiReviewsPage.labels.rejection_reason')}</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{req.rejection_reason}</p>
                          </div>
                        )}

                        {req.status === 'completed' && req.ai_response && (
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800/30">
                            <h4 className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 mb-3">
                              <SparklesIcon className="w-5 h-5" /> {t('aiReviewsPage.labels.ai_explanation')}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                              {req.ai_response}
                            </p>
                            <p className="text-xs text-purple-500 dark:text-purple-400 mt-3 flex items-center gap-1">
                              <CpuChipIcon className="w-3 h-3" /> {t('aiReviewsPage.labels.generated_by_gemini')}
                            </p>
                          </div>
                        )}

                        <button onClick={() => handleViewRequest(req)} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 active:scale-95">
                          <EyeIcon className="w-4 h-4" /> {t('aiReviewsPage.actions.view_full_details')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showNewRequestModal && user?.role === 'patient' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowNewRequestModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SparklesIcon className="w-6 h-6" /> {t('aiReviewsPage.labels.new_request_title')}
              </h2>
              <button onClick={() => setShowNewRequestModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={labelClass}>{t('aiReviewsPage.labels.source_type_label')}</label>
                <select className={inputClass} value={selectedSourceType} onChange={e => { setSelectedSourceType(e.target.value); setSelectedSourceId(''); }}>
                  <option value="medical_record">{t('aiReviewsPage.labels.source_type_medical_record')}</option>
                  <option value="lab">{t('aiReviewsPage.labels.source_type_lab')}</option>
                  <option value="radiology">{t('aiReviewsPage.labels.source_type_radiology')}</option>
                  <option value="prescription">{t('aiReviewsPage.labels.source_type_prescription')}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{t('aiReviewsPage.labels.choose_source_label')}</label>
                <select className={inputClass} value={selectedSourceId} onChange={e => setSelectedSourceId(e.target.value)}>
                  <option value="">{t('aiReviewsPage.labels.source_placeholder')}</option>
                  {selectedSourceType === 'medical_record' && availableSources.medical_records.map(s => (
                    <option key={s.id} value={s.id} disabled={s.has_pending_request}>{s.title} - {s.subtitle} {s.has_pending_request ? t('aiReviewsPage.labels.pending_request_label') : ''}</option>
                  ))}
                  {selectedSourceType === 'lab' && availableSources.lab_results.map(s => (
                    <option key={s.id} value={s.id} disabled={s.has_pending_request}>{s.title} - {s.subtitle} {s.has_pending_request ? t('aiReviewsPage.labels.pending_request_label') : ''}</option>
                  ))}
                  {selectedSourceType === 'radiology' && availableSources.radiology_results.map(s => (
                    <option key={s.id} value={s.id} disabled={s.has_pending_request}>{s.title} - {s.subtitle} {s.has_pending_request ? t('aiReviewsPage.labels.pending_request_label') : ''}</option>
                  ))}
                  {selectedSourceType === 'prescription' && availableSources.prescriptions.map(s => (
                    <option key={s.id} value={s.id} disabled={s.has_pending_request}>{s.title} - {s.subtitle} {s.has_pending_request ? t('aiReviewsPage.labels.pending_request_label') : ''}</option>
                  ))}
                </select>
              </div>

              {selectedSourceId && previewSourceDetails && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800/30">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <DocumentTextIcon className="w-3 h-3" /> {t('aiReviewsPage.labels.source_summary')}
                    </p>
                    <button 
                      onClick={() => setShowPreviewModal(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <EyeIcon className="w-3 h-3" /> {t('aiReviewsPage.actions.preview')}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    {selectedSourceType === 'medical_record' && (
                      <>
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.diagnosis')}:</span> {previewSourceDetails.diagnosis || t('aiReviewsPage.labels.unknown')}</p>
                        {previewSourceDetails.chief_complaint && (
                          <p><span className="font-semibold">{t('aiReviewsPage.labels.chief_complaint')}:</span> {previewSourceDetails.chief_complaint.substring(0, 50)}...</p>
                        )}
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.request_date_title')}:</span> {formatDate(previewSourceDetails.created_at)}</p>
                      </>
                    )}
                    {selectedSourceType === 'lab' && (
                      <>
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.test_type')}:</span> {previewSourceDetails.test_name || previewSourceDetails.test_type || t('aiReviewsPage.labels.unknown')}</p>
                        {previewSourceDetails.result && (
                          <p><span className="font-semibold">{t('aiReviewsPage.labels.result')}:</span> {previewSourceDetails.result.substring(0, 50)}...</p>
                        )}
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.request_date')}:</span> {formatDate(previewSourceDetails.requested_at)}</p>
                      </>
                    )}
                    {selectedSourceType === 'radiology' && (
                      <>
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.scan_type')}:</span> {previewSourceDetails.scan_type || t('aiReviewsPage.labels.unknown')}</p>
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.body_part')}:</span> {previewSourceDetails.body_part || t('aiReviewsPage.labels.unknown')}</p>
                        {previewSourceDetails.result && (
                          <p><span className="font-semibold">{t('aiReviewsPage.labels.radiology_report')}:</span> {previewSourceDetails.result.substring(0, 50)}...</p>
                        )}
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.request_date')}:</span> {formatDate(previewSourceDetails.requested_at)}</p>
                      </>
                    )}
                    {selectedSourceType === 'prescription' && (
                      <>
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.medications')}:</span> {previewSourceDetails.medications ? previewSourceDetails.medications.substring(0, 50) : t('aiReviewsPage.labels.unknown')}</p>
                        {previewSourceDetails.instructions && (
                          <p><span className="font-semibold">{t('aiReviewsPage.labels.instructions')}:</span> {previewSourceDetails.instructions.substring(0, 50)}...</p>
                        )}
                        <p><span className="font-semibold">{t('aiReviewsPage.labels.request_date')}:</span> {formatDate(previewSourceDetails.created_at)}</p>
                      </>
                    )}
                    {previewSourceFiles.length > 0 && (
                      <p className="text-blue-500">📎 {t('aiReviewsPage.labels.attached_files', { count: previewSourceFiles.length })}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>{t('aiReviewsPage.labels.priority_label')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'low', label: t('aiReviewsPage.status.priority_low') },
                    { value: 'normal', label: t('aiReviewsPage.status.priority_normal') },
                    { value: 'high', label: t('aiReviewsPage.status.priority_high') },
                    { value: 'urgent', label: t('aiReviewsPage.status.priority_urgent') }
                  ].map(p => (
                    <button key={p.value} type="button" onClick={() => setRequestPriority(p.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                        requestPriority === p.value
                          ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t('aiReviewsPage.labels.reason_label')}</label>
                <textarea className={inputClass} rows="3" placeholder={t('aiReviewsPage.labels.reason_placeholder')} value={requestReason} onChange={e => setRequestReason(e.target.value)} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('aiReviewsPage.labels.char_count', { count: requestReason.length })}</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <ClockIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  {t('aiReviewsPage.labels.info_doctor_review')}
                </p>
              </div>

              <button onClick={handleSubmitNewRequest} disabled={!selectedSourceId || requestReason.length < 10 || !isOnline}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {t('aiReviewsPage.actions.send_request')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && previewSourceDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-auto" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
                {t('aiReviewsPage.labels.preview_title', { type: getSourceTypeText(selectedSourceType) })}
              </h2>
              <button onClick={() => setShowPreviewModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600"></div>
                  <span className="mr-3 text-gray-500">{t('aiReviewsPage.labels.loading_details')}</span>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {selectedSourceType === 'medical_record' && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.diagnosis')}</p>
                          <p className="font-bold text-blue-700 dark:text-blue-400">{previewSourceDetails.diagnosis || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.request_date_title')}</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatDate(previewSourceDetails.created_at)}</p>
                        </div>
                      </div>
                      {previewSourceDetails.chief_complaint && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.chief_complaint')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.chief_complaint}</p>
                        </div>
                      )}
                      {previewSourceDetails.treatment_plan && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.treatment_plan')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.treatment_plan}</p>
                        </div>
                      )}
                      {previewSourceDetails.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.notes')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.doctor_label')} {previewSourceDetails.doctor_name}</p>
                    </div>
                  )}

                  {selectedSourceType === 'lab' && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.test_type')}</p>
                          <p className="font-bold text-blue-700 dark:text-blue-400">{previewSourceDetails.test_type || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.test_name')}</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">{previewSourceDetails.test_name || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                      </div>
                      {previewSourceDetails.result && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.result')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{previewSourceDetails.result}</p>
                        </div>
                      )}
                      {previewSourceDetails.description && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.description')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.description}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.date_label')} {formatDate(previewSourceDetails.requested_at)}</p>
                    </div>
                  )}

                  {selectedSourceType === 'radiology' && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.scan_type')}</p>
                          <p className="font-bold text-blue-700 dark:text-blue-400">{previewSourceDetails.scan_type || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.body_part')}</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">{previewSourceDetails.body_part || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                      </div>
                      {previewSourceDetails.result && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.radiology_report')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{previewSourceDetails.result}</p>
                        </div>
                      )}
                      {previewSourceDetails.description && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.description')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.description}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.date_label')} {formatDate(previewSourceDetails.requested_at)}</p>
                    </div>
                  )}

                  {selectedSourceType === 'prescription' && (
                    <div className="p-4 space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.medications')}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{previewSourceDetails.medications || t('aiReviewsPage.labels.unknown')}</p>
                      </div>
                      {previewSourceDetails.instructions && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.instructions')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{previewSourceDetails.instructions}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.status')}</p>
                          <p className="font-bold text-amber-700 dark:text-amber-400">
                            {previewSourceDetails.status === 'dispensed' ? t('aiReviewsPage.labels.dispensed') : t('aiReviewsPage.labels.pending_status')}
                          </p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.created_date')}</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatDate(previewSourceDetails.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewSourceFiles.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-blue-500" />
                        {t('aiReviewsPage.labels.attached_files', { count: previewSourceFiles.length })}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {previewSourceFiles.map((file, idx) => {
                          const isPDF = file.filename?.endsWith('.pdf') || file.type === 'pdf';
                          const fileUrl = file.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${file.url}`;
                          
                          return (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all group">
                              {isPDF ? (
                                <div className="aspect-square flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20">
                                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center mt-1">{file.filename}</p>
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" 
                                    className="mt-2 text-xs text-blue-500 hover:underline">
                                    {t('aiReviewsPage.labels.open_pdf')}
                                  </a>
                                </div>
                              ) : (
                                <div className="relative aspect-square overflow-hidden group">
                                  <img 
                                    src={fileUrl} 
                                    alt={`preview-${idx}`} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.src = '/placeholder-image.png';
                                      e.target.className = 'w-full h-full object-contain p-4 bg-gray-100 dark:bg-gray-700';
                                    }}
                                  />
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <EyeIcon className="w-8 h-8 text-white" />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button onClick={() => setShowPreviewModal(false)} 
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 active:scale-95 transition-all">
                {t('aiReviewsPage.actions.close_preview')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                {t('aiReviewsPage.labels.request_details_title', { id: selectedRequest.id })}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiReviewsPage.labels.patient')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{selectedRequest.patient?.name}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiReviewsPage.labels.doctor')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{selectedRequest.doctor?.name || t('aiReviewsPage.labels.no_doctor_assigned')}</p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-amber-800/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiReviewsPage.labels.source_type')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5 flex items-center gap-1">
                    {getSourceIcon(selectedRequest.source?.type)} {getSourceTypeText(selectedRequest.source?.type)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiReviewsPage.labels.request_date')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {getPriorityBadge(selectedRequest.priority)}
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500" />
                  {t('aiReviewsPage.labels.reason_heading')}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  {selectedRequest.request_reason}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  {t('aiReviewsPage.labels.source_details_title', { type: getSourceTypeText(selectedRequest.source?.type) })}
                </h3>
                
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600"></div>
                    <span className="mr-3 text-gray-500">{t('aiReviewsPage.labels.loading_details')}</span>
                  </div>
                ) : sourceDetails ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {selectedRequest.source?.type === 'medical_record' && (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.diagnosis')}</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400">{sourceDetails.diagnosis || t('aiReviewsPage.labels.unknown')}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.request_date_title')}</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatDate(sourceDetails.created_at)}</p>
                          </div>
                        </div>
                        {sourceDetails.chief_complaint && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.chief_complaint')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.chief_complaint}</p>
                          </div>
                        )}
                        {sourceDetails.treatment_plan && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.treatment_plan')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.treatment_plan}</p>
                          </div>
                        )}
                        {sourceDetails.notes && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.notes')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.notes}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.doctor_label')} {sourceDetails.doctor_name}</p>
                      </div>
                    )}

                    {selectedRequest.source?.type === 'lab' && (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.test_type')}</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400">{sourceDetails.test_type || t('aiReviewsPage.labels.unknown')}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.test_name')}</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">{sourceDetails.test_name || t('aiReviewsPage.labels.unknown')}</p>
                          </div>
                        </div>
                        {sourceDetails.result && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.result')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{sourceDetails.result}</p>
                          </div>
                        )}
                        {sourceDetails.description && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.description')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.description}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.date_label')} {formatDate(sourceDetails.requested_at)}</p>
                      </div>
                    )}

                    {selectedRequest.source?.type === 'radiology' && (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.scan_type')}</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400">{sourceDetails.scan_type || t('aiReviewsPage.labels.unknown')}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.body_part')}</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">{sourceDetails.body_part || t('aiReviewsPage.labels.unknown')}</p>
                          </div>
                        </div>
                        {sourceDetails.result && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.radiology_report')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{sourceDetails.result}</p>
                          </div>
                        )}
                        {sourceDetails.description && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.description')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.description}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{t('aiReviewsPage.labels.date_label')} {formatDate(sourceDetails.requested_at)}</p>
                      </div>
                    )}

                    {selectedRequest.source?.type === 'prescription' && (
                      <div className="p-4 space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.medications')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{sourceDetails.medications || t('aiReviewsPage.labels.unknown')}</p>
                        </div>
                        {sourceDetails.instructions && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.instructions')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sourceDetails.instructions}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.status')}</p>
                            <p className="font-bold text-amber-700 dark:text-amber-400">
                              {sourceDetails.status === 'dispensed' ? t('aiReviewsPage.labels.dispensed') : t('aiReviewsPage.labels.pending_status')}
                            </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('aiReviewsPage.labels.created_date')}</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatDate(sourceDetails.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {sourceFiles.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <PhotoIcon className="w-5 h-5 text-blue-500" />
                          {t('aiReviewsPage.labels.attached_files', { count: sourceFiles.length })}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {sourceFiles.map((file, idx) => {
                            const isPDF = file.filename?.endsWith('.pdf') || file.type === 'pdf';
                            const fileUrl = file.url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${file.url}`;
                            
                            return (
                              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all group">
                                {isPDF ? (
                                  <div className="aspect-square flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20">
                                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center mt-1">{file.filename}</p>
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" 
                                      className="mt-2 text-xs text-blue-500 hover:underline">
                                      {t('aiReviewsPage.labels.open_pdf')}
                                    </a>
                                  </div>
                                ) : (
                                  <div className="relative aspect-square overflow-hidden group">
                                    <img 
                                      src={fileUrl} 
                                      alt={`file-${idx}`} 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      onError={(e) => {
                                        e.target.src = '/placeholder-image.png';
                                        e.target.className = 'w-full h-full object-contain p-4 bg-gray-100 dark:bg-gray-700';
                                      }}
                                    />
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <EyeIcon className="w-8 h-8 text-white" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">{t('aiReviewsPage.labels.no_source_details')}</p>
                )}
              </div>

              {selectedRequest.doctor_notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">📝 {t('aiReviewsPage.labels.doctor_notes')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.doctor_notes}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">❌ {t('aiReviewsPage.labels.rejection_reason')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.status === 'completed' && selectedRequest.ai_response && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800/30">
                  <h3 className="font-bold text-lg text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" /> {t('aiReviewsPage.labels.ai_explanation')}
                  </h3>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                    {selectedRequest.ai_response}
                  </p>
                  <p className="text-xs text-purple-500 mt-3 flex items-center gap-1">
                    <CpuChipIcon className="w-3 h-3" /> {t('aiReviewsPage.labels.generated_by_gemini')}
                  </p>
                </div>
              )}

              {user?.role === 'doctor' && selectedRequest.status === 'pending_doctor' && (
                <div className="flex gap-3">
                  <button onClick={() => { setShowDetailsModal(false); openApproveModal(selectedRequest); }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" /> {t('aiReviewsPage.actions.approve_and_show')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showApproveModal && selectedRequest && user?.role === 'doctor' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowApproveModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{t('aiReviewsPage.labels.approve_modal_title', { id: selectedRequest.id })}</h2>
              <button onClick={() => setShowApproveModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-bold">{t('aiReviewsPage.labels.patient_info')}</span> {selectedRequest.patient?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"><span className="font-bold">{t('aiReviewsPage.labels.request_reason_info')}</span> {selectedRequest.request_reason}</p>
              </div>

              {approveData.suggested_response && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                  <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> {t('aiReviewsPage.labels.proposed_ai_explanation')}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                    {approveData.suggested_response}
                  </p>
                  <p className="text-xs text-purple-500 mt-2 flex items-center gap-1">
                    <CpuChipIcon className="w-3 h-3" /> {t('aiReviewsPage.labels.can_approve_or_reject')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setApproveData({...approveData, approve: true})}
                  className={`py-3 rounded-xl border font-bold transition-all active:scale-95 ${approveData.approve ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/25' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  {t('aiReviewsPage.actions.approve')}
                </button>
                <button onClick={() => setApproveData({...approveData, approve: false})}
                  className={`py-3 rounded-xl border font-bold transition-all active:scale-95 ${!approveData.approve ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-transparent shadow-lg shadow-red-500/25' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  {t('aiReviewsPage.actions.reject')}
                </button>
              </div>

              {approveData.approve ? (
                <div>
                  <label className={labelClass}>{t('aiReviewsPage.labels.doctor_notes_optional')}</label>
                  <textarea className={inputClass} rows="3" placeholder={t('aiReviewsPage.labels.doctor_notes_placeholder')} value={approveData.doctor_notes} onChange={e => setApproveData({...approveData, doctor_notes: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label className={`${labelClass} !text-red-600 dark:!text-red-400`}>{t('aiReviewsPage.labels.rejection_reason_required')}</label>
                  <textarea className={`${inputClass} border-red-300 dark:border-red-700 focus:ring-red-500`} rows="3" placeholder={t('aiReviewsPage.labels.rejection_reason_placeholder')} value={approveData.rejection_reason} onChange={e => setApproveData({...approveData, rejection_reason: e.target.value})} />
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800/30">
                <p className="text-xs text-amber-700 dark:text-amber-400">{t('aiReviewsPage.labels.after_approval_note')}</p>
              </div>

              <button onClick={handleApproveReject} disabled={!isOnline}
                className={`w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg active:scale-95 transition-all ${approveData.approve ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25' : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/25'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {approveData.approve ? t('aiReviewsPage.actions.confirm_approve') : t('aiReviewsPage.actions.confirm_reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AIReviewsPage;
