import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  UserGroupIcon, CalendarIcon, DocumentTextIcon, BeakerIcon,
  CameraIcon, HeartIcon, ChatBubbleLeftRightIcon, StarIcon,
  XMarkIcon, PlusIcon, EnvelopeIcon, EyeIcon, SparklesIcon,
  ChevronDownIcon, ChevronUpIcon, CurrencyDollarIcon, CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [radiologyResults, setRadiologyResults] = useState([]);
  const [chronicDiseases, setChronicDiseases] = useState([]);
  const [myDoctors, setMyDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [patientComplaints, setPatientComplaints] = useState([]);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [selectedComplaintDetails, setSelectedComplaintDetails] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [complaint, setComplaint] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  // Expandable States - للكشوفات والمواعيد
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  
  // Pharmacy States
  const [prescriptions, setPrescriptions] = useState([]);
  
  // AI Review States
  const [aiReviewRequests, setAiReviewRequests] = useState([]);
  const [showAiRequestModal, setShowAiRequestModal] = useState(false);
  const [selectedRecordForAI, setSelectedRecordForAI] = useState(null);
  const [aiRequestReason, setAiRequestReason] = useState('');
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [selectedAIResult, setSelectedAIResult] = useState(null);

  // Rating States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDoctorForRating, setSelectedDoctorForRating] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingReview, setRatingReview] = useState('');

  // ===== Payment States =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState(null);
  const [paymentFee, setPaymentFee] = useState(200);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // ===== دالة جلب الإشعارات =====
  const fetchNotifications = async () => {
    try {
      await api.get('/notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: t('patientDashboard.status.pending'),
      approved: t('patientDashboard.status.approved'),
      paid: t('patientDashboard.status.paid'),
      in_progress: t('patientDashboard.status.in_progress'),
      completed: t('patientDashboard.status.completed'),
      cancelled: t('patientDashboard.status.cancelled'),
      rejected: t('patientDashboard.status.rejected')
    };
    return statusMap[status] || status;
  };

  // Toggle expand للكشوفات
  const toggleRecordExpand = (recordId) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  // Toggle expand للمواعيد
  const toggleAppointmentExpand = (appointmentId) => {
    setExpandedAppointmentId(expandedAppointmentId === appointmentId ? null : appointmentId);
  };

  // جلب روشتات المريض
  const fetchMyPrescriptions = async () => {
    try {
      const response = await api.get('/pharmacy/prescriptions');
      const myPrescriptions = response.data?.filter(p => p.patient_id === user?.id) || [];
      setPrescriptions(myPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  };

  // جلب كشوفات المريض (السجلات الطبية)
  const fetchMedicalRecords = async () => {
    try {
      const response = await api.get('/patients/medical-records');
      console.log('📌 Medical Records:', response.data);
      setMedicalRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    }
  };

  // جلب الأطباء الذين تعامل معهم المريض
  const fetchMyDoctors = async () => {
    try {
      const response = await api.get('/patients/my-doctors');
      setMyDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching my doctors:', error);
      setMyDoctors([]);
    }
  };

  // ===== دالة جلب جميع البيانات =====
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        doctorsRes, appointmentsRes, labRes, radiologyRes, chronicRes,
        medicalRecordsRes
      ] = await Promise.all([
        api.get('/doctors/all').catch(() => ({ data: [] })),
        api.get('/appointments/my').catch(() => ({ data: [] })),
        api.get('/lab/my-results').catch(() => ({ data: [] })),
        api.get('/radiology/my-results').catch(() => ({ data: [] })),
        api.get('/patients/chronic-diseases').catch(() => ({ data: [] })),
        api.get('/patients/medical-records').catch(() => ({ data: [] }))
      ]);
      
      const doctorsWithRatings = await Promise.all(
        (doctorsRes.data || []).map(async (doctor) => {
          try {
            const ratingRes = await api.get(`/ratings/doctor/${doctor.id}`);
            return {
              ...doctor,
              average_rating: ratingRes.data.average_rating,
              total_ratings: ratingRes.data.total_ratings
            };
          } catch {
            return { ...doctor, average_rating: 0, total_ratings: 0 };
          }
        })
      );
      
      setDoctors(doctorsWithRatings);
      setAppointments(appointmentsRes.data || []);
      setLabResults(labRes.data || []);
      setRadiologyResults(radiologyRes.data || []);
      setChronicDiseases(chronicRes.data || []);
      setMedicalRecords(medicalRecordsRes.data || []);
      
      await Promise.all([
        fetchMyDoctors(),
        fetchMyPrescriptions()
      ]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('patientDashboard.messages.loading_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // جلب شكاوى المريض
  const fetchPatientComplaints = async () => {
    try {
      const response = await api.get("/complaints/my");
      setPatientComplaints(response.data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  // جلب طلبات شرح AI الخاصة بالمريض
  const fetchAIReviewRequests = async () => {
    try {
      const response = await api.get('/ai/reviews/my-requests');
      console.log('📌 AI Review Requests:', response.data);
      setAiReviewRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching AI requests:', error);
      setAiReviewRequests([]);
    }
  };

  // عرض تفاصيل الشكوى مع الردود
  const handleViewComplaintReplies = async (complaintId) => {
    try {
      const response = await api.get(`/complaints/${complaintId}`);
      setSelectedComplaintDetails(response.data);
      setShowComplaintsModal(true);
    } catch (error) {
      toast.error(t('patientDashboard.messages.complaint_details_error'));
    }
  };

  // إرسال شكوى لكل الأطباء
  const handleSendComplaint = async () => {
    if (!complaintTitle || !complaint) {
      toast.error(t('patientDashboard.messages.complaint_required'));
      return;
    }
    try {
      await api.post('/complaints', {
        title: complaintTitle,
        content: complaint
      });
      toast.success(t('patientDashboard.messages.send_complaint_success'));
      setShowComplaintModal(false);
      setComplaintTitle('');
      setComplaint('');
      fetchPatientComplaints();
    } catch (error) {
      toast.error(t('patientDashboard.messages.send_complaint_error'));
    }
  };

  // عرض تفاصيل الكشف
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  // فتح مودال طلب شرح AI
  const handleRequestAIReview = (record) => {
    console.log('📌 Selected Record for AI:', record);
    
    // ✅ تأكد من وجود البيانات المطلوبة
    if (!record.id) {
      toast.error(t('patientDashboard.messages.record_incomplete'));
      return;
    }
    
    // ✅ doctor_id موجود في record.doctor_id
    if (!record.doctor_id) {
      toast.error(t('patientDashboard.messages.doctor_missing'));
      return;
    }
    
    setSelectedRecordForAI(record);
    setAiRequestReason('');
    setShowAiRequestModal(true);
  };

  // ===== إرسال طلب شرح AI =====
 // ===== إرسال طلب شرح AI =====
const submitAIReviewRequest = async () => {
  if (!aiRequestReason.trim()) {
    toast.error(t('patientDashboard.messages.ai_request_reason_required'));
    return;
  }
  
  if (!user?.id) {
    toast.error(t('patientDashboard.messages.login_required'));
    return;
  }
  
  if (!selectedRecordForAI?.id) {
    toast.error(t('patientDashboard.messages.record_incomplete'));
    return;
  }
  
  const doctorId = selectedRecordForAI.doctor_id;
  if (!doctorId) {
    toast.error(t('patientDashboard.messages.doctor_missing'));
    console.error('❌ Missing doctor_id in selectedRecordForAI:', selectedRecordForAI);
    return;
  }
  
  try {
    const payload = {
      patient_id: Number(user.id),
      doctor_id: Number(doctorId),
      source_type: 'medical_record',
      source_id: Number(selectedRecordForAI.id),
      request_reason: aiRequestReason.trim()
    };
    
    console.log('📤 Sending AI review request payload:', JSON.stringify(payload, null, 2));
    
    const response = await api.post('/ai/reviews/request', payload);
    console.log('✅ Response:', response.data);
    
    toast.success(t('patientDashboard.messages.ai_request_success'));
    setShowAiRequestModal(false);
    setSelectedRecordForAI(null);
    setAiRequestReason('');
    fetchAIReviewRequests();
  } catch (error) {
    console.error('❌ Error submitting AI request:', error.response?.data);
    
    let errorMessage = t('patientDashboard.messages.ai_request_error');
    
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        const messages = error.response.data.detail.map(item => {
          if (item.msg) return `${item.loc?.join('.') || ''}: ${item.msg}`;
          if (typeof item === 'string') return item;
          return JSON.stringify(item);
        });
        errorMessage = messages.join(' | ');
        console.error('❌ Validation errors:', messages);
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    toast.error(errorMessage);
  }
};

  // عرض نتيجة شرح AI
  const handleViewAIResult = (request) => {
    console.log('📌 AI Result:', request);
    setSelectedAIResult(request);
    setShowAiResultModal(true);
  };

  // ===== دالة حجز الموعد =====
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !complaint || !appointmentDate) {
      toast.error(t('patientDashboard.messages.booking_required'));
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error(t('patientDashboard.messages.login_required'));
      return;
    }
    
    try {
      await api.post('/appointments/book', {
        doctor_id: selectedDoctor.id,
        complaint: complaint,
        scheduled_date: appointmentDate
      });
      toast.success(t('patientDashboard.messages.booking_success'));
      setShowBookingModal(false);
      setSelectedDoctor(null);
      setComplaint('');
      setAppointmentDate('');
      const appointmentsRes = await api.get('/appointments/my');
      setAppointments(appointmentsRes.data || []);
      fetchNotifications();
    } catch (error) {
      console.error('❌ Error booking appointment:', error.response?.data);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      toast.error(error.response?.data?.detail || t('patientDashboard.messages.booking_error'));
    }
  };

  // ===== دالة دفع الكشف =====
  const openPaymentModal = (apt) => {
    setSelectedAppointmentForPayment(apt);
    setPaymentFee(apt.fee || 200);
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const handlePayAppointment = async () => {
    if (!selectedAppointmentForPayment) return;
    
    try {
      await api.post(`/appointments/${selectedAppointmentForPayment.id}/pay`, {
        fee: paymentFee,
        payment_method: paymentMethod
      });
      
      toast.success(t('patientDashboard.messages.payment_success'));
      setShowPaymentModal(false);
      setSelectedAppointmentForPayment(null);
      
      const appointmentsRes = await api.get('/appointments/my');
      setAppointments(appointmentsRes.data || []);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || t('patientDashboard.messages.payment_error'));
    }
  };

  // فتح مودال التقييم
  const openRatingModal = (doctor) => {
    setSelectedDoctorForRating(doctor);
    setSelectedRating(doctor.my_rating || 0);
    setRatingReview('');
    setShowRatingModal(true);
  };

  // إرسال التقييم
  const submitRating = async () => {
    if (selectedRating === 0) {
      toast.error(t('patientDashboard.messages.rating_required'));
      return;
    }
    
    try {
      await api.post('/ratings/rate-doctor', {
        doctor_id: selectedDoctorForRating.id,
        rating: selectedRating,
        review: ratingReview
      });
      toast.success(t('patientDashboard.messages.rating_success'));
      setShowRatingModal(false);
      fetchData();
      fetchMyDoctors();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(t('patientDashboard.messages.rating_error'));
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      fetchData();
      fetchPatientComplaints();
      fetchAIReviewRequests();
    }
  }, [user]);

  const tabs = [
    { id: 'doctors', label: t('patientDashboard.tabs.doctors'), icon: <UserGroupIcon className="w-5 h-5" /> },
    { id: 'records', label: t('patientDashboard.tabs.records'), icon: <DocumentTextIcon className="w-5 h-5" /> },
    { id: 'appointments', label: t('patientDashboard.tabs.appointments'), icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'complaints', label: t('patientDashboard.tabs.complaints'), icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { id: 'chronic', label: t('patientDashboard.tabs.chronic'), icon: <HeartIcon className="w-5 h-5" /> },
    { id: 'myDoctors', label: t('patientDashboard.tabs.myDoctors'), icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { id: 'aiRequests', label: t('patientDashboard.tabs.aiRequests'), icon: <SparklesIcon className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('patientDashboard.loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* ===== Header Section ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-800 dark:via-purple-900 dark:to-pink-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-4xl">👋</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                  {t('patientDashboard.welcome')}, {user?.username}
                </h1>
                <p className="text-indigo-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {t('patientDashboard.patient_dashboard')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowComplaintModal(true)} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95"
            >
              <EnvelopeIcon className="w-5 h-5" />
              {t('patientDashboard.send_complaint')}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: t('patientDashboard.stats_doctors'), count: doctors.length, icon: '👨‍⚕️', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('patientDashboard.stats_appointments'), count: appointments.length, icon: '📅', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('patientDashboard.stats_records'), count: medicalRecords.length, icon: '📋', color: 'from-amber-400/20 to-amber-500/20' },
              { label: t('patientDashboard.stats_ai_requests'), count: aiReviewRequests.length, icon: '✨', color: 'from-pink-400/20 to-pink-500/20' },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all duration-300`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.count}</p>
                    <p className="text-white/70 text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Tabs Navigation ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== الأطباء ===== */}
        {activeTab === 'doctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.length === 0 ? (
              <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-10 h-10 text-indigo-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.empty.no_doctors')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('patientDashboard.empty.no_doctors_subtitle')}</p>
              </div>
            ) : (
              doctors.map(doctor => (
                <div key={doctor.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{doctor.name}</h3>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{doctor.specialty || t('doctors.general')}</p>
                        
                          <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon 
                                key={star}
                                className={`w-4 h-4 transition-colors ${star <= (doctor.average_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{doctor.average_rating || t('patientDashboard.status.new')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">({doctor.total_ratings || 0} {t('patientDashboard.rating.review')})</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                            🏥 {doctor.experience || 0} {t('patientDashboard.rating.years_exp')}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowBookingModal(true);
                          }}
                          className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95"
                        >
                          {t('patientDashboard.actions.book_appointment')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== كشوفاتي - Expandable Cards ===== */}
        {activeTab === 'records' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('patientDashboard.tabs.records')}</h3>
              <button 
                onClick={() => fetchData()} 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {t('patientDashboard.actions.refresh')}
              </button>
            </div>
            
            <div className="space-y-3">
              {medicalRecords.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="w-10 h-10 text-amber-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.empty.no_records')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('patientDashboard.empty.no_records_subtitle')}</p>
                </div>
              ) : (
                medicalRecords.map(record => {
                  const isExpanded = expandedRecordId === record.id;
                  return (
                    <div 
                      key={record.id} 
                      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                        isExpanded 
                          ? 'border-indigo-300 dark:border-indigo-600 shadow-xl shadow-indigo-500/10' 
                          : 'border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleRecordExpand(record.id)}
                        className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-all duration-500 ${
                            isExpanded 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                              : 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40'
                          }`}>
                            <span className="text-xl">
                              {isExpanded ? '📂' : '📋'}
                            </span>
                          </div>
                          <div className="text-right">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                              {t('patientDashboard.doctor_prefix')}{record.doctor_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-medium">
                                📅 {new Date(record.created_at).toLocaleDateString('ar-EG')}
                              </span>
                              <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                                {record.diagnosis}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          isExpanded 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 rotate-180' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </button>

                      <div className={`transition-all duration-500 ease-in-out ${
                        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden`}>
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.record.date')}</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">
                                  {new Date(record.created_at).toLocaleDateString('ar-EG', { 
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.record.doctor')}</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{t('patientDashboard.doctor_prefix')}{record.doctor_name}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
                                <span>💬</span> {t('patientDashboard.record.chief_complaint')}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{record.chief_complaint}</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
                                <span>🔍</span> {t('patientDashboard.record.symptoms')}
                              </h4>
                              {record.symptoms && record.symptoms.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {record.symptoms.map((symptom, idx) => (
                                    <span key={idx} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-600">
                                      {symptom}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 dark:text-gray-500">{t('patientDashboard.record.no_symptoms')}</p>
                              )}
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-2">
                                <span>📋</span> {t('patientDashboard.record.diagnosis')}
                              </h4>
                              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{record.diagnosis}</p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                              <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2">
                                <span>💊</span> {t('patientDashboard.record.treatment_plan')}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{record.treatment_plan || t('patientDashboard.record.no_treatment_plan')}</p>
                            </div>

                            {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
                              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800/30">
                              <h4 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-3">
                                <span>🫀</span> {t('patientDashboard.record.vital_signs')}
                              </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {Object.entries(record.vital_signs).map(([key, val]) => val && (
                                    <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-rose-100 dark:border-rose-800/30 shadow-sm text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{key}</p>
                                      <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{val}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-3 pt-2">
                              <button 
                                onClick={() => handleRequestAIReview(record)} 
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95"
                              >
                                <SparklesIcon className="w-5 h-5" />
                                {t('patientDashboard.actions.request_ai')}
                              </button>
                              <button 
                                onClick={() => handleViewRecord(record)} 
                                className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 active:scale-95"
                              >
                                <EyeIcon className="w-5 h-5" />
                                {t('patientDashboard.actions.view_full')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===== المواعيد - Expandable Cards ===== */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-10 h-10 text-blue-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.empty.no_appointments')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('patientDashboard.empty.no_appointments_subtitle')}</p>
              </div>
            ) : (
              appointments.map(apt => {
                const isExpanded = expandedAppointmentId === apt.id;
                return (
                  <div 
                    key={apt.id} 
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${
                      isExpanded 
                        ? 'border-blue-300 dark:border-blue-600 shadow-xl shadow-blue-500/10' 
                        : 'border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className={`h-1.5 ${
                      apt.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                      apt.status === 'approved' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                      apt.status === 'paid' ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                      apt.status === 'in_progress' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                      apt.status === 'completed' ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
                      apt.status === 'cancelled' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                      'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}></div>

                    <button
                      onClick={() => toggleAppointmentExpand(apt.id)}
                      className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-all duration-500 ${
                          isExpanded 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40'
                        }`}>
                          <span className="text-xl">
                            {isExpanded ? '📂' : '📅'}
                          </span>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                            {t('patientDashboard.doctor_prefix')}{apt.doctor_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                              📅 {apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('ar-EG') : '-'}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              apt.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                              apt.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                              apt.status === 'paid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                              apt.status === 'in_progress' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800' :
                              apt.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                              apt.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
                              'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                            }`}>
                              {getStatusText(apt.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isExpanded 
                          ? 'bg-blue-100 dark:bg-blue-900/30 rotate-180' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${
                      isExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}>
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <div className="p-6 space-y-4">
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.appointment.doctor')}</p>
                              <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t('patientDashboard.doctor_prefix')}{apt.doctor_name}</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.appointment.date')}</p>
                              <p className="font-bold text-gray-800 dark:text-gray-100">
                                {apt.scheduled_date 
                                  ? new Date(apt.scheduled_date).toLocaleDateString('ar-EG', { 
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                    })
                                  : '-'
                                }
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.appointment.time')}</p>
                              <p className="font-bold text-gray-800 dark:text-gray-100">
                                {apt.scheduled_date 
                                  ? new Date(apt.scheduled_date).toLocaleTimeString('ar-EG', { 
                                      hour: '2-digit', minute: '2-digit' 
                                    })
                                  : '-'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2">
                              <span>💬</span> {t('patientDashboard.appointment.complaint')}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{apt.complaint}</p>
                          </div>

                          <div className={`rounded-xl p-4 border ${
                            apt.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' :
                            apt.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' :
                            apt.status === 'paid' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' :
                            apt.status === 'in_progress' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30' :
                            apt.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' :
                            apt.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' :
                            'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                          }`}>
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                              <span>
                                {apt.status === 'pending' && '⏳'}
                                {apt.status === 'approved' && '✅'}
                                {apt.status === 'paid' && '💰'}
                                {apt.status === 'in_progress' && '👨‍⚕️'}
                                {apt.status === 'completed' && '🎉'}
                                {apt.status === 'cancelled' && '❌'}
                                {apt.status === 'rejected' && '🚫'}
                              </span>
                              <span className={`${
                                apt.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                                apt.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
                                apt.status === 'paid' ? 'text-blue-600 dark:text-blue-400' :
                                apt.status === 'in_progress' ? 'text-purple-600 dark:text-purple-400' :
                                apt.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                apt.status === 'cancelled' ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                {t('patientDashboard.appointment.status')}
                              </span>
                            </h4>
                            <p className={`text-lg font-bold ${
                              apt.status === 'pending' ? 'text-amber-700 dark:text-amber-300' :
                              apt.status === 'approved' ? 'text-emerald-700 dark:text-emerald-300' :
                              apt.status === 'paid' ? 'text-blue-700 dark:text-blue-300' :
                              apt.status === 'in_progress' ? 'text-purple-700 dark:text-purple-300' :
                              apt.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' :
                              apt.status === 'cancelled' ? 'text-red-700 dark:text-red-300' :
                              'text-gray-700 dark:text-gray-300'
                            }`}>
                              {getStatusText(apt.status)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              {apt.status === 'pending' && t('patientDashboard.status.pending_desc')}
                              {apt.status === 'approved' && t('patientDashboard.status.approved_desc')}
                              {apt.status === 'paid' && t('patientDashboard.status.paid_desc')}
                              {apt.status === 'in_progress' && t('patientDashboard.status.in_progress_desc')}
                              {apt.status === 'completed' && t('patientDashboard.status.completed_desc')}
                              {apt.status === 'cancelled' && t('patientDashboard.status.cancelled_desc')}
                              {apt.status === 'rejected' && t('patientDashboard.status.rejected_desc')}
                            </p>
                          </div>

                          {/* ===== قسم الدفع ===== */}
                          {apt.status === 'approved' && !apt.is_paid && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('patientDashboard.appointment.payment_required')}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('patientDashboard.appointment.payment_fee')}: {apt.fee || 200} {t('patientDashboard.currency')}</p>
                                </div>
                                <button 
                                  onClick={() => openPaymentModal(apt)}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
                                >
                                  <CurrencyDollarIcon className="w-5 h-5" />
                                  {t('patientDashboard.actions.pay_now')}
                                </button>
                              </div>
                            </div>
                          )}

                          {apt.is_paid && apt.status === 'paid' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                              <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('patientDashboard.appointment.paid')}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('patientDashboard.appointment.waiting')}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {apt.status === 'in_progress' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">👨‍⚕️</span>
                                <div>
                                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">{t('patientDashboard.appointment.in_progress')}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('patientDashboard.appointment.entered_clinic')}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {apt.notes && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                              <h4 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                                <span>📝</span> {t('patientDashboard.appointment.notes')}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{apt.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== الأمراض المزمنة ===== */}
        {activeTab === 'chronic' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <HeartIcon className="w-6 h-6 text-red-500" />
                {t('patientDashboard.tabs.chronic')}
              </h3>
            </div>
            <div className="p-6">
              {chronicDiseases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartIcon className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">✅ {t('patientDashboard.empty.no_chronic')}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{t('patientDashboard.empty.no_chronic_subtitle')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chronicDiseases.map(disease => (
                    <div key={disease.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-100 dark:border-red-800/30 hover:shadow-md transition-all duration-300">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🫀</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-700 dark:text-red-400">{disease.disease_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('patientDashboard.chronic.diagnosed_on', { date: new Date(disease.diagnosed_date).toLocaleDateString('ar-EG') })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== أطبائي ===== */}
        {activeTab === 'myDoctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDoctors.length === 0 ? (
              <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.empty.no_my_doctors')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('patientDashboard.empty.no_my_doctors_subtitle')}</p>
              </div>
            ) : (
              myDoctors.map(doctor => (
                <div key={doctor.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{doctor.name}</h3>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-0.5">{doctor.specialty || t('doctors.general')}</p>
                        
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon 
                                key={star}
                                className={`w-4 h-4 ${star <= (doctor.average_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{doctor.average_rating || t('patientDashboard.status.new')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">({doctor.total_ratings || 0} {t('patientDashboard.rating.review')})</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                            {t('patientDashboard.myDoctors.visit_count', { count: doctor.visits || 0 })}
                          </span>
                        </div>
                        
                        {doctor.last_visit && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                            {t('patientDashboard.myDoctors.last_visit', { date: new Date(doctor.last_visit).toLocaleDateString('ar-EG') })}
                          </p>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowBookingModal(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/25 active:scale-95"
                          >
                            {t('patientDashboard.actions.book_appointment')}
                          </button>
                          
                          <button
                            onClick={() => openRatingModal(doctor)}
                            className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 border border-amber-200 dark:border-amber-800 active:scale-95"
                          >
                            <StarIcon className="w-4 h-4" />
                            {doctor.my_rating ? t('patientDashboard.actions.edit_rating') : t('patientDashboard.actions.rate_doctor')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== طلبات شرح AI ===== */}
        {activeTab === 'aiRequests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-500" />
                {t('patientDashboard.ai.request_title')}
              </h3>
              <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
                {t('patientDashboard.ai.request_count', { count: aiReviewRequests.length })}
              </span>
            </div>
            
            {aiReviewRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.empty.no_ai_requests')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('patientDashboard.empty.no_ai_requests_subtitle')}</p>
              </div>
            ) : (
              aiReviewRequests.map(request => (
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl flex items-center justify-center">
                            <span className="text-lg">📋</span>
                          </div>
                          <p className="font-bold text-gray-800 dark:text-gray-100">{t('patientDashboard.ai.source_type_record')}</p>
                          <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                            request.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                            request.status === 'approved' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                            request.status === 'pending_doctor' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            request.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
                            'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                          }`}>
                            {request.status === 'completed' && t('patientDashboard.ai.status_completed')}
                            {request.status === 'approved' && t('patientDashboard.ai.status_approved')}
                            {request.status === 'pending_doctor' && t('patientDashboard.ai.status_pending_doctor')}
                            {request.status === 'rejected' && t('patientDashboard.ai.status_rejected')}
                          </span>
                        </div>
                        <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{t('patientDashboard.ai.request_reason_label')}</span> {request.request_reason}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                          {t('patientDashboard.ai.request_date', { date: new Date(request.created_at).toLocaleDateString('ar-EG') })}
                        </p>
                        {request.status === 'completed' && request.ai_response && (
                          <button 
                            onClick={() => handleViewAIResult(request)}
                            className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95"
                          >
                            <SparklesIcon className="w-4 h-4" />
                            {t('patientDashboard.actions.view_full')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== شكواي ===== */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                📢 {t('patientDashboard.tabs.complaints')}
              </h3>
              <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-semibold px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800">
                {t('patientDashboard.complaints.request_count', { count: patientComplaints.length })}
              </span>
            </div>
            
            {patientComplaints.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16 px-8">
                <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('patientDashboard.complaints.no_complaints')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('patientDashboard.complaints.no_complaints_subtitle')}</p>
              </div>
            ) : (
              patientComplaints.map(complaint => (
                <div key={complaint.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className={`h-1 ${
                    complaint.status === 'replied' ? 'bg-emerald-400' :
                    complaint.status === 'pending' ? 'bg-amber-400' :
                    'bg-gray-300'
                  }`}></div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{complaint.title}</h4>
                          <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                            complaint.status === 'replied' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                            complaint.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                          }`}>
                            {complaint.status === 'replied' ? t('patientDashboard.complaints.status_replied') : complaint.status === 'pending' ? t('patientDashboard.complaints.status_pending') : complaint.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-3 line-clamp-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">{complaint.content}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                          {t('patientDashboard.complaints.date_label')}{new Date(complaint.created_at).toLocaleDateString('ar-EG')}
                        </p>
                        <div className="mt-4">
                          <button 
                            onClick={() => handleViewComplaintReplies(complaint.id)}
                            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 border border-indigo-200 dark:border-indigo-800"
                          >
                            <EyeIcon className="w-4 h-4" />
                            {t('patientDashboard.complaints.replies')} ({complaint.replies?.length || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ===== Modal تفاصيل الكشف ===== */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                📋 {t('patientDashboard.record.details_title')}
              </h2>
              <button onClick={() => setShowRecordModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all duration-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.record.date')}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{new Date(selectedRecord.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.record.doctor')}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{selectedRecord.doctor_name}</p>
                </div>
              </div>
              
              {[
                { title: t('patientDashboard.record.chief_complaint'), content: selectedRecord.chief_complaint, icon: '💬' },
                { title: t('patientDashboard.record.symptoms'), content: selectedRecord.symptoms?.join('، ') || t('patientDashboard.record.none'), icon: '🔍' },
                { title: t('patientDashboard.record.diagnosis'), content: selectedRecord.diagnosis, icon: '📋', highlight: true },
                { title: t('patientDashboard.record.treatment_plan'), content: selectedRecord.treatment_plan || t('patientDashboard.record.none'), icon: '💊' },
              ].map((section, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${section.highlight ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700'}`}>
                  <h3 className={`font-bold flex items-center gap-2 ${section.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    <span>{section.icon}</span>
                    {section.title}
                  </h3>
                  <p className={`mt-2 ${section.highlight ? 'text-lg font-semibold text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>{section.content}</p>
                </div>
              ))}
              
              {selectedRecord.vital_signs && Object.keys(selectedRecord.vital_signs).length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                  <h3 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <span>🫀</span>
                    {t('patientDashboard.record.vital_signs')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {Object.entries(selectedRecord.vital_signs).map(([key, val]) => val && (
                      <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{key}:</span> 
                        <span className="font-bold text-gray-800 dark:text-gray-100 mr-1">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal حجز موعد ===== */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  📅 {t('patientDashboard.booking.title', { name: selectedDoctor.name })}
                </h3>
                <button onClick={() => setShowBookingModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('patientDashboard.booking.specialty')}</label>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">{selectedDoctor.specialty || t('doctors.general')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.complaints.content')}</label>
                <textarea 
                  value={complaint} 
                  onChange={(e) => setComplaint(e.target.value)} 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 resize-none" 
                  rows="3" 
                  placeholder={t('patientDashboard.booking.complaint_placeholder')} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.booking.date_label')}</label>
                <input 
                  type="datetime-local" 
                  value={appointmentDate} 
                  onChange={(e) => setAppointmentDate(e.target.value)} 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300" 
                  required 
                />
              </div>
              
              <button 
                onClick={handleBookAppointment} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95"
              >
                {t('patientDashboard.booking.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal إرسال شكوى ===== */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  📢 {t('patientDashboard.send_complaint')}
                </h3>
                <button onClick={() => setShowComplaintModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.complaints.title')}</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300" 
                  placeholder={t('patientDashboard.complaints.title_placeholder')} 
                  value={complaintTitle} 
                  onChange={(e) => setComplaintTitle(e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.complaints.content')}</label>
                <textarea 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 resize-none" 
                  rows="5" 
                  placeholder={t('patientDashboard.booking.complaint_placeholder')} 
                  value={complaint} 
                  onChange={(e) => setComplaint(e.target.value)} 
                  required 
                />
              </div>
              
              <button 
                onClick={handleSendComplaint} 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95"
              >
                {t('patientDashboard.complaints.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal عرض تفاصيل الشكوى والردود ===== */}
      {showComplaintsModal && selectedComplaintDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                📢 {t('patientDashboard.complaints.details')}
              </h2>
              <button onClick={() => setShowComplaintsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all duration-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-5 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="font-bold text-red-700 dark:text-red-400 text-lg">{t('patientDashboard.complaints.title_label', { title: selectedComplaintDetails.title })}</p>
                <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-line leading-relaxed">{selectedComplaintDetails.content}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                  {t('patientDashboard.complaints.date_sent', { date: new Date(selectedComplaintDetails.created_at).toLocaleString('ar-EG') })}
                </p>
              </div>

              {selectedComplaintDetails.replies && selectedComplaintDetails.replies.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-500" /> 
                    {t('patientDashboard.complaints.replies')} ({selectedComplaintDetails.replies.length})
                  </h3>
                  {selectedComplaintDetails.replies.map((reply, idx) => (
                    <div key={reply.id || idx} className="bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-700/30 dark:to-indigo-900/10 p-5 rounded-xl border-r-4 border-indigo-400 dark:border-indigo-500 shadow-sm">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                          <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-sm">👨‍⚕️</span>
                          {t('patientDashboard.doctor_prefix')}{reply.doctor_name}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg">
                          {new Date(reply.replied_at || reply.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-line leading-relaxed">{reply.message}</p>
                      {reply.action && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 px-3 py-1.5 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                            {reply.action === 'advice' && t('patientDashboard.complaints.action_advice')}
                            {reply.action === 'diagnosis' && t('patientDashboard.complaints.action_diagnosis')}
                            {reply.action === 'appointment' && t('patientDashboard.complaints.action_appointment')}
                            {reply.action === 'lab' && t('patientDashboard.complaints.action_lab')}
                            {reply.action === 'radiology' && t('patientDashboard.complaints.action_radiology')}
                            {reply.action === 'prescription' && t('patientDashboard.complaints.action_prescription')}
                          </span>
                          {reply.action_details && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium">
                              {t('patientDashboard.complaints.action_details_prefix')}{reply.action_details}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{t('patientDashboard.complaints.no_replies')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal طلب شرح AI ===== */}
      {showAiRequestModal && selectedRecordForAI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6" />
                  {t('patientDashboard.ai.request_title')}
                </h3>
                <button onClick={() => setShowAiRequestModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 space-y-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.ai.doctor_label')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {selectedRecordForAI.doctor_name || t('patientDashboard.ai.doctor_unknown')}
                    {selectedRecordForAI.doctor_id && (
                      <span className="text-xs text-gray-400 mr-2">(ID: {selectedRecordForAI.doctor_id})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.ai.diagnosis_label')}</p>
                  <p className="font-bold text-purple-700 dark:text-purple-400 text-lg">{selectedRecordForAI.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.ai.date_label')}</p>
                  <p className="text-gray-700 dark:text-gray-300">{new Date(selectedRecordForAI.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.ai.request_reason')}</label>
                <textarea 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 resize-none" 
                  rows="3" 
                  placeholder={t('patientDashboard.ai.request_reason_placeholder')}
                  value={aiRequestReason}
                  onChange={(e) => setAiRequestReason(e.target.value)}
                />
              </div>
              
              <button 
                onClick={submitAIReviewRequest} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95"
              >
                {t('patientDashboard.ai.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal عرض نتيجة شرح AI ===== */}
      {showAiResultModal && selectedAIResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-500" />
                {t('patientDashboard.ai.result_title')}
              </h2>
              <button onClick={() => setShowAiResultModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all duration-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800/30 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-200 dark:bg-purple-800/50 rounded-lg flex items-center justify-center text-xs">❓</span>
                    {t('patientDashboard.ai.request_reason')}:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">{selectedAIResult.request_reason}</p>
                </div>
                
                <div className="border-t border-purple-200 dark:border-purple-700"></div>
                
                <div>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-200 dark:bg-purple-800/50 rounded-lg flex items-center justify-center text-xs">✨</span>
                    {t('patientDashboard.ai.result_title')}:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                    {selectedAIResult.ai_response || t('patientDashboard.ai.explanation_placeholder')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal تقييم الطبيب ===== */}
      {showRatingModal && selectedDoctorForRating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  ⭐ {t('patientDashboard.rating.title')} {selectedDoctorForRating.name}
                </h3>
                <button onClick={() => setShowRatingModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-100 dark:border-amber-800/30">
                <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">{t('patientDashboard.rating.choose')}</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className="focus:outline-none transform transition-all duration-200 hover:scale-125 active:scale-95"
                    >
                      <StarIcon 
                        className={`w-12 h-12 transition-all duration-300 ${
                          star <= selectedRating 
                            ? 'text-amber-400 fill-amber-400 drop-shadow-lg' 
                            : 'text-gray-200 dark:text-gray-600 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-base font-bold mt-4 text-gray-700 dark:text-gray-300">
                  {selectedRating === 1 && t('patientDashboard.rating.poor')}
                  {selectedRating === 2 && t('patientDashboard.rating.fair')}
                  {selectedRating === 3 && t('patientDashboard.rating.good')}
                  {selectedRating === 4 && t('patientDashboard.rating.very_good')}
                  {selectedRating === 5 && t('patientDashboard.rating.excellent')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.rating.comment')}</label>
                <textarea 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 resize-none" 
                  rows="3" 
                  placeholder={t('patientDashboard.rating.comment_placeholder')}
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                />
              </div>
              
              <button 
                onClick={submitRating} 
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
              >
                {t('patientDashboard.rating.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal دفع الكشف ===== */}
      {showPaymentModal && selectedAppointmentForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6" />
                  {t('patientDashboard.actions.pay_now')}
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.appointment.doctor')}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">{selectedAppointmentForPayment.doctor_name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.appointment.date')}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {selectedAppointmentForPayment.scheduled_date 
                      ? new Date(selectedAppointmentForPayment.scheduled_date).toLocaleDateString('ar-EG')
                      : '-'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.appointment.payment_fee')}</label>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 text-center">
                  {paymentFee} {t('patientDashboard.currency')}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('patientDashboard.appointment.payment_method')}</label>
                <select 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">💵 {t('patientDashboard.appointment.cash')}</option>
                  <option value="card">💳 {t('patientDashboard.appointment.card')}</option>
                  <option value="online">📱 {t('patientDashboard.appointment.online')}</option>
                </select>
              </div>
              
              <button 
                onClick={handlePayAppointment} 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {t('patientDashboard.actions.confirm_payment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PatientDashboard;