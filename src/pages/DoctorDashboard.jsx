import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  UsersIcon, CalendarIcon, BeakerIcon, CurrencyDollarIcon,
  CpuChipIcon, DocumentTextIcon, ArrowPathIcon, EyeIcon,
  HeartIcon, XMarkIcon, CheckIcon, UserCircleIcon,
  PlusIcon, ClockIcon, ChatBubbleLeftRightIcon,
  SparklesIcon, PaperAirplaneIcon, ChevronRightIcon,
  ChevronDownIcon, CalendarDaysIcon, PencilSquareIcon,
  TrashIcon, CheckCircleIcon, XCircleIcon,
  ChevronLeftIcon, ChartBarIcon, CameraIcon
} from '@heroicons/react/24/outline';

// ===== Custom Date & Time Picker Component =====
const DateTimePicker = ({ value, onChange, onClose }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [selectedHour, setSelectedHour] = useState(value ? new Date(value).getHours() : 9);
  const [selectedMinute, setSelectedMinute] = useState(value ? new Date(value).getMinutes() : 0);
  const [step, setStep] = useState('date');

  const monthNames = t('doctorDashboard.dateTimePicker.months', { returnObjects: true });
  const dayNames = t('doctorDashboard.dateTimePicker.days', { returnObjects: true });

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    if (newDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;
    setSelectedDate(newDate);
    setStep('time');
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedHour, selectedMinute, 0);
    const formatted = `${finalDate.getFullYear()}-${String(finalDate.getMonth() + 1).padStart(2, '0')}-${String(finalDate.getDate()).padStart(2, '0')}T${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(formatted);
    onClose();
  };

  const isToday = (day) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isPast = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {step === 'date' ? t('doctorDashboard.dateTimePicker.selectDate') : t('doctorDashboard.dateTimePicker.selectTime')}
            </h3>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-sm text-blue-100">{t('doctorDashboard.dateTimePicker.selectedDateLabel')}</p>
            <p className="text-xl font-bold mt-1">
              {selectedDate 
                ? `${selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : t('doctorDashboard.dateTimePicker.noDate')}
            </p>
            {selectedDate && (
              <p className="text-lg text-blue-100 mt-0.5">
                {t('doctorDashboard.dateTimePicker.hour')} {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                {selectedHour >= 12 ? t('doctorDashboard.dateTimePicker.pm') : t('doctorDashboard.dateTimePicker.am')}
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => setStep('date')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${step === 'date' ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {t('doctorDashboard.dateTimePicker.dateTab')}
            </button>
            <button 
              onClick={() => selectedDate && setStep('time')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${step === 'time' ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'} ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t('doctorDashboard.dateTimePicker.timeTab')}
            </button>
          </div>
        </div>

        {step === 'date' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <button onClick={nextMonth} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-10"></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const past = isPast(day);
                const todayDay = isToday(day);
                const selected = isSelected(day);
                return (
                  <button
                    key={day}
                    onClick={() => !past && handleSelectDate(day)}
                    disabled={past}
                    className={`h-10 w-full rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                        : todayDay
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700'
                          : past
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'time' && (
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('doctorDashboard.dateTimePicker.hourLabel')}</label>
              <div className="grid grid-cols-6 gap-2">
                {hours.map(h => (
                  <button
                    key={h}
                    onClick={() => setSelectedHour(h)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedHour === h
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('doctorDashboard.dateTimePicker.minutesLabel')}</label>
              <div className="grid grid-cols-6 gap-2">
                {minutes.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMinute(m)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedMinute === m
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30 text-center">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedHour >= 12 ? t('doctorDashboard.dateTimePicker.evening') : t('doctorDashboard.dateTimePicker.morning')}
              </p>
            </div>
          </div>
        )}

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          {step === 'time' && (
            <button
              onClick={() => setStep('date')}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              {t('doctorDashboard.dateTimePicker.backToDate')}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg active:scale-95 ${
              selectedDate
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {t('doctorDashboard.dateTimePicker.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== Reschedule Modal Component =====
const RescheduleModal = ({ appointment, onConfirm, onClose }) => {
  const [newDate, setNewDate] = useState('');
  const [showPicker, setShowPicker] = useState(true);

  return (
    <DateTimePicker
      value={newDate}
      onChange={(val) => {
        setNewDate(val);
        onConfirm(val);
      }}
      onClose={onClose}
    />
  );
};

// ===================================================================
// ===== MAIN COMPONENT =====
// ===================================================================
const DoctorDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({ total_patients: 0, total_records: 0, today_appointments: 0, pending_appointments: 0 });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [aiReviews, setAiReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTab, setSelectedTab] = useState('patients');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Expandable & Reschedule States
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

  // Complaint Modal States
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintReplies, setComplaintReplies] = useState({});
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAction, setReplyAction] = useState('advice');
  const [replyDetails, setReplyDetails] = useState('');
  
  const [selectedPatientComplaints, setSelectedPatientComplaints] = useState(null);
  const [showPatientComplaintsModal, setShowPatientComplaintsModal] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  
  const [selectedAIResponse, setSelectedAIResponse] = useState(null);
  const [showAIResponseModal, setShowAIResponseModal] = useState(false);
  
  const [chronicDiseases, setChronicDiseases] = useState([]);
  const [showChronicModal, setShowChronicModal] = useState(false);
  const [selectedChronicPatient, setSelectedChronicPatient] = useState(null);
  const [newChronicDisease, setNewChronicDisease] = useState({ disease_name: '', diagnosed_date: '', notes: '', is_active: true });
  
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState([]);
  const [patientChronicList, setPatientChronicList] = useState([]);
  const [patientLabResults, setPatientLabResults] = useState([]);
  const [patientRadiologyResults, setPatientRadiologyResults] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientSummary, setPatientSummary] = useState(null);
  
  const [activeDetailsTab, setActiveDetailsTab] = useState('summary');
  const [showChronicFormInDetails, setShowChronicFormInDetails] = useState(false);
  const [newChronicDiseaseInDetails, setNewChronicDiseaseInDetails] = useState({ disease_name: '', diagnosed_date: '', notes: '', is_active: true });
  
  const [showPatientActionsModal, setShowPatientActionsModal] = useState(false);
  const [selectedActionPatient, setSelectedActionPatient] = useState(null);
  
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState(null);
  const [medicalRecordData, setMedicalRecordData] = useState({ chief_complaint: '', diagnosis: '', treatment_plan: '', notes: '', symptoms: [], vital_signs: {}, differential_diagnosis: [], is_chronic: false });
  
  const [labTests, setLabTests] = useState([]);
  const [radiologyScans, setRadiologyScans] = useState([]);
  const [medications, setMedications] = useState([]);
  const [labTechs, setLabTechs] = useState([]);
  const [radiologyTechs, setRadiologyTechs] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  
  const [requestData, setRequestData] = useState({ patient_id: '', patient_name: '', lab_tech_id: '', test_type: '', test_name: '', description: '', amount: '', scan_type: '', body_part: '', medications: '', instructions: '', scheduled_date: '', new_date: '', reject_reason: '' });

  const getApiErrorMessage = (error) => {
    const data = error?.response?.data;
    if (!data) return null;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map(item => item.msg || JSON.stringify(item)).join(' | ');
    if (typeof data.detail === 'object') return JSON.stringify(data.detail);
    if (typeof data.errors === 'object') return Object.values(data.errors).flat().join(' | ');
    return data.message || data.detail || null;
  };

  const toggleAppointmentExpand = (id) => setExpandedAppointmentId(expandedAppointmentId === id ? null : id);

  // ===== Reschedule Handler =====
  const handleReschedule = (apt) => {
    setRescheduleAppointment(apt);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async (newDate) => {
    try {
      await api.put(`/appointments/${rescheduleAppointment.id}/reschedule`, { new_date: newDate });
      toast.success(t('doctorDashboard.messages.rescheduleSuccess'));
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      fetchData();
    } catch (error) {
      toast.error(t('doctorDashboard.messages.rescheduleError'));
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, patientsRes, appointmentsRes, aiRes, labTestsRes, radiologyScansRes, medicationsRes, labTechsRes, radiologyTechsRes, pharmacistsRes, complaintsRes] = await Promise.all([
        api.get('/doctors/statistics'), api.get('/doctors/my-patients'), api.get('/appointments/my'),
        api.get('/ai/reviews/pending'), api.get('/lab/test-types'), api.get('/radiology/scan-types'),
        api.get('/pharmacy/medications'), api.get('/users/by-role/lab_tech'), api.get('/users/by-role/radiology_tech'),
        api.get('/users/by-role/pharmacist'), api.get('/complaints/doctor')
      ]);
      
      console.log('📌 Appointments data:', appointmentsRes.data);
      
      setStats({
        total_patients: statsRes.data.total_patients || 0, 
        total_records: statsRes.data.total_records || 0,
        today_appointments: appointmentsRes.data.filter(a => new Date(a.scheduled_date).toDateString() === new Date().toDateString() && a.status === 'approved').length,
        pending_appointments: appointmentsRes.data.filter(a => a.status === 'pending').length
      });
      setPatients(patientsRes.data); 
      setAppointments(appointmentsRes.data); 
      setAiReviews(aiRes.data);
      setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
      setLabTests(labTestsRes.data || []); 
      setRadiologyScans(radiologyScansRes.data || []);
      setMedications(medicationsRes.data || []); 
      setLabTechs(labTechsRes.data || []);
      setRadiologyTechs(radiologyTechsRes.data || []); 
      setPharmacists(pharmacistsRes.data || []);
    } catch (error) {
      if (error.response?.status === 404) setComplaints([]);
      else toast.error(t('doctorDashboard.messages.loadError'));
    } finally { setIsLoading(false); }
  };

  // ====== تحديث دالة جلب تفاصيل المريض ======
  const fetchPatientFullDetails = async (patientId) => {
    try {
      const [recordsRes, chronicRes, labRes, radiologyRes, prescriptionsRes, appointmentsRes, summaryRes] = await Promise.all([
        api.get(`/patients/${patientId}/medical-records`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/chronic-diseases`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/lab-results`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/radiology-results`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/prescriptions`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/appointments`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/summary`).catch(() => ({ data: {} }))
      ]);
      
      setPatientMedicalRecords(recordsRes.data || []);
      setPatientChronicList(chronicRes.data || []);
      setPatientLabResults(labRes.data || []);
      setPatientRadiologyResults(radiologyRes.data || []);
      setPatientPrescriptions(prescriptionsRes.data || []);
      setPatientAppointments(appointmentsRes.data || []);
      setPatientSummary(summaryRes.data || {});
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error(t('doctorDashboard.messages.patientDetailsError'));
    }
  };

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatientDetails(patient);
    setActiveDetailsTab('summary');
    setShowChronicFormInDetails(false);
    setNewChronicDiseaseInDetails({ disease_name: '', diagnosed_date: '', notes: '', is_active: true });
    await fetchPatientFullDetails(patient.id);
    setShowPatientDetailsModal(true);
  };

  const handleAddChronicDiseaseInDetails = async () => {
    if (!newChronicDiseaseInDetails.disease_name) { toast.error(t('doctorDashboard.messages.enterDiseaseName')); return; }
    try {
      const diagnosedDate = newChronicDiseaseInDetails.diagnosed_date ? new Date(newChronicDiseaseInDetails.diagnosed_date).toISOString() : new Date().toISOString();
      await api.post(`/patients/${selectedPatientDetails.id}/chronic-diseases`, { disease_name: newChronicDiseaseInDetails.disease_name, diagnosed_date: diagnosedDate, notes: newChronicDiseaseInDetails.notes || "", is_active: true });
      toast.success(t('doctorDashboard.messages.chronicAdded'));
      setNewChronicDiseaseInDetails({ disease_name: '', diagnosed_date: '', notes: '', is_active: true }); setShowChronicFormInDetails(false);
      await fetchPatientFullDetails(selectedPatientDetails.id);
    } catch (error) { toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.chronicAddError')); }
  };

  const handleDeleteChronicDiseaseInDetails = async (diseaseId) => {
    if (!window.confirm(t('doctorDashboard.messages.confirmDeleteChronic'))) return;
    try { await api.delete(`/patients/${selectedPatientDetails.id}/chronic-diseases/${diseaseId}`); toast.success(t('doctorDashboard.messages.chronicDeleted')); await fetchPatientFullDetails(selectedPatientDetails.id); }
    catch (error) { toast.error(t('doctorDashboard.messages.chronicDeleteError')); }
  };

  const handleViewPatientComplaints = async (patient) => {
    try { const response = await api.get(`/complaints/patient/${patient.id}`); setSelectedPatientData(response.data); setShowPatientComplaintsModal(true); }
    catch (error) { toast.error(t('doctorDashboard.messages.complaintsLoadError')); }
  };

  const handleViewChronicDiseases = async (patient) => {
    try { const response = await api.get(`/patients/${patient.id}/chronic-diseases`); setChronicDiseases(response.data); setSelectedChronicPatient(patient); setNewChronicDisease({ disease_name: '', diagnosed_date: '', notes: '', is_active: true }); setShowChronicModal(true); }
    catch (error) { toast.error(t('doctorDashboard.messages.chronicLoadError')); }
  };

  const handleViewAIResponse = (aiResponse) => { setSelectedAIResponse(aiResponse); setShowAIResponseModal(true); };

  const analyzeComplaintWithAI = async (complaint) => {
    setIsAnalyzing(true); setAiAnalysis('');
    try {
      const response = await api.post('/ai/analyze-complaint', { complaint: complaint.content, complaint_title: complaint.title, patient_info: { name: complaint.patient_name, age: complaint.patient_age || t('doctorDashboard.defaults.unspecified') } });
      setAiAnalysis(response.data.analysis || response.data.message || t('doctorDashboard.messages.analysisFallback')); toast.success(t('doctorDashboard.messages.aiAnalysisSuccess'));
    } catch (error) {
      if (error.response?.status === 429) { setAiAnalysis(t('doctorDashboard.messages.aiBusy')); }
      else if (error.response?.status === 503) { setAiAnalysis(t('doctorDashboard.messages.aiUnavailable')); }
      else { setAiAnalysis(t('doctorDashboard.messages.aiFailed')); }
    } finally { setIsAnalyzing(false); }
  };

  const handleReplyToComplaint = async () => {
    if (!replyMessage.trim()) { toast.error(t('doctorDashboard.messages.writeReply')); return; }
    try {
      await api.post(`/complaints/${selectedComplaint.id}/reply`, { complaint_id: selectedComplaint.id, doctor_id: user?.id, doctor_name: user?.username || user?.name || t('doctorDashboard.defaults.doctor'), message: replyMessage, action: replyAction, action_details: replyDetails, replied_at: new Date().toISOString() });
      toast.success(t('doctorDashboard.messages.replySent')); setShowComplaintModal(false); setSelectedComplaint(null); setReplyMessage(''); setReplyDetails(''); setAiAnalysis(''); fetchData();
    } catch (error) { toast.error(t('doctorDashboard.messages.replyError')); }
  };

  const openComplaintModal = async (complaint) => {
    if (!complaint || !complaint.id) { toast.error(t('doctorDashboard.messages.complaintDataIncomplete')); return; }
    setSelectedComplaint(complaint); setReplyMessage(""); setReplyAction("advice"); setReplyDetails(""); setAiAnalysis(""); setShowComplaintModal(true);
    try { const response = await api.get(`/complaints/${complaint.id}`); setSelectedComplaint(response.data); } catch (error) {}
    await analyzeComplaintWithAI(complaint);
  };

  // ================================================================
  // ===== دوال الدفع وتأكيد الدخول =====
  // ================================================================

  const handleConfirmEntry = async (appointmentId) => {
    if (!window.confirm(t('doctorDashboard.messages.confirmEntry'))) return;
    try {
      await api.put(`/appointments/${appointmentId}/confirm-entry`);
      toast.success(t('doctorDashboard.messages.entryConfirmed'));
      fetchData();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.entryError'));
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!window.confirm(t('doctorDashboard.messages.confirmComplete'))) return;
    try {
      await api.put(`/appointments/${appointmentId}/complete`);
      toast.success(t('doctorDashboard.messages.completeSuccess'));
      fetchData();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.completeError'));
    }
  };

  // ===== فتح مودال إضافة كشف طبي للموعد =====
  const openMedicalRecordModalForAppointment = (apt) => {
    console.log('📌 Appointment data:', apt);
    console.log('📌 patient_id:', apt.patient_id);
    console.log('📌 patient_name:', apt.patient_name);
    
    // ✅ تأكد من أن الموعد في حالة in_progress
    if (apt.status !== 'in_progress') {
      toast.error(t('doctorDashboard.messages.medicalRecordOnlyInProgress'));
      return;
    }
    
    // ✅ تأكد من وجود patient_id
    if (!apt.patient_id) {
      toast.error(t('doctorDashboard.messages.patientDataIncomplete'));
      return;
    }
    
    setSelectedPatientForRecord({ 
      id: apt.patient_id, 
      username: apt.patient_name || t('doctorDashboard.defaults.patient'),
      appointment_id: apt.id
    });
    
    setMedicalRecordData({ 
      chief_complaint: apt.complaint || '', 
      diagnosis: '', 
      treatment_plan: '', 
      notes: '',
      symptoms: [],
      vital_signs: {},
      differential_diagnosis: [],
      is_chronic: false
    });
    
    setShowMedicalRecordModal(true);
  };

  // ===== فتح مودال إضافة روشتة للموعد =====
  const openPrescriptionModalForAppointment = (apt) => {
    // ✅ تأكد من أن الموعد في حالة in_progress
    if (apt.status !== 'in_progress') {
      toast.error(t('doctorDashboard.messages.prescriptionOnlyInProgress'));
      return;
    }
    
    // ✅ تأكد من وجود patient_id
    if (!apt.patient_id) {
      toast.error(t('doctorDashboard.messages.patientDataIncomplete'));
      return;
    }
    
    setRequestData({
      ...requestData,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name || t('doctorDashboard.defaults.patient'),
      appointment_id: apt.id,
      medications: '',
      instructions: ''
    });
    
    setModalType('prescription');
    setShowModal(true);
  };

  // ===== فتح مودال طلب تحاليل للموعد =====
  const openLabRequestModalForAppointment = (apt) => {
    // ✅ تأكد من أن الموعد في حالة in_progress
    if (apt.status !== 'in_progress') {
      toast.error(t('doctorDashboard.messages.labOnlyInProgress'));
      return;
    }
    
    // ✅ تأكد من وجود patient_id
    if (!apt.patient_id) {
      toast.error(t('doctorDashboard.messages.patientDataIncomplete'));
      return;
    }
    
    setRequestData({
      ...requestData,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name || t('doctorDashboard.defaults.patient'),
      appointment_id: apt.id,
      test_type: '',
      test_name: '',
      description: '',
      amount: ''
    });
    
    setModalType('lab');
    setShowModal(true);
  };

  // ===== فتح مودال طلب أشعة للموعد =====
  const openRadiologyRequestModalForAppointment = (apt) => {
    // ✅ تأكد من أن الموعد في حالة in_progress
    if (apt.status !== 'in_progress') {
      toast.error(t('doctorDashboard.messages.radiologyOnlyInProgress'));
      return;
    }
    
    // ✅ تأكد من وجود patient_id
    if (!apt.patient_id) {
      toast.error(t('doctorDashboard.messages.patientDataIncomplete'));
      return;
    }
    
    setRequestData({
      ...requestData,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name || t('doctorDashboard.defaults.patient'),
      appointment_id: apt.id,
      scan_type: '',
      body_part: ''
    });
    
    setModalType('radiology');
    setShowModal(true);
  };

  // ================================================================
  // ===== دوال المواعيد الأصلية =====
  // ================================================================

  const handleApproveAppointment = async (apt) => { 
    try { 
      await api.put(`/appointments/${apt.id}/approve`); 
      toast.success(t('doctorDashboard.messages.approveSuccess')); 
      fetchData(); 
    } catch (error) { 
      toast.error(t('doctorDashboard.messages.approveError')); 
    } 
  };

  const handleRejectAppointment = async (apt) => {
    const reason = prompt(t('doctorDashboard.modals.rejectReasonPlaceholder'));
    try { 
      await api.put(`/appointments/${apt.id}/reject`, { reason: reason || '' }); 
      toast.success(t('doctorDashboard.messages.rejectSuccess')); 
      fetchData(); 
    } catch (error) { 
      toast.error(t('doctorDashboard.messages.rejectError')); 
    }
  };

  const handleCancelAppointment = async (apt) => {
    if (!window.confirm(t('doctorDashboard.messages.confirmCancel'))) return;
    try { 
      await api.put(`/appointments/${apt.id}/cancel`); 
      toast.success(t('doctorDashboard.messages.cancelSuccess')); 
      fetchData(); 
    } catch (error) { 
      toast.error(t('doctorDashboard.messages.cancelError')); 
    }
  };

  const handleSendLabRequest = async () => { 
    if (!requestData.patient_id || !requestData.lab_tech_id || !requestData.test_type || !requestData.test_name) { 
      toast.error(t('doctorDashboard.messages.completeAllFields')); 
      return; 
    } 
    try { 
      await api.post('/lab/requests', {
        patient_id: Number(requestData.patient_id),
        lab_tech_id: Number(requestData.lab_tech_id),
        test_type: requestData.test_type,
        test_name: requestData.test_name,
        description: requestData.description || '',
        amount: Number(requestData.amount || 0)
      }); 
      toast.success(t('doctorDashboard.messages.labRequestSent')); 
      setShowModal(false); 
      setRequestData({ patient_id: '', patient_name: '', lab_tech_id: '', test_type: '', test_name: '', scan_type: '', body_part: '', medications: '', instructions: '', scheduled_date: '', new_date: '', reject_reason: '', description: '', amount: '' }); 
      fetchData(); 
    } catch (error) { 
      toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.requestSendError')); 
    } 
  };
  
  const handleSendRadiologyRequest = async () => { 
    if (!requestData.patient_id || !requestData.scan_type || !requestData.body_part) { 
      toast.error(t('doctorDashboard.messages.completeAllFields')); 
      return; 
    } 
    try { 
      await api.post('/radiology/requests', {
        patient_id: Number(requestData.patient_id),
        scan_type: requestData.scan_type,
        body_part: requestData.body_part,
        description: requestData.instructions || ''
      }); 
      toast.success(t('doctorDashboard.messages.radiologyRequestSent')); 
      setShowModal(false); 
      setRequestData({ patient_id: '', patient_name: '', lab_tech_id: '', test_type: '', test_name: '', scan_type: '', body_part: '', medications: '', instructions: '', scheduled_date: '', new_date: '', reject_reason: '', description: '', amount: '' }); 
      fetchData(); 
    } catch (error) { 
      toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.requestSendError')); 
    } 
  };
  
  const handleSendPrescription = async () => { 
    if (!requestData.patient_id || !requestData.medications) { 
      toast.error(t('doctorDashboard.messages.completeAllFields')); 
      return; 
    } 
    try { 
      await api.post('/pharmacy/prescriptions', {
        patient_id: Number(requestData.patient_id),
        medications: requestData.medications,
        instructions: requestData.instructions || ''
      }); 
      toast.success(t('doctorDashboard.messages.prescriptionSent')); 
      setShowModal(false); 
      setRequestData({ patient_id: '', patient_name: '', lab_tech_id: '', test_type: '', test_name: '', scan_type: '', body_part: '', medications: '', instructions: '', scheduled_date: '', new_date: '', reject_reason: '', description: '', amount: '' }); 
      fetchData(); 
    } catch (error) { 
      toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.prescriptionSendError')); 
    } 
  };

  const handleApproveAI = async (review) => { 
    try { 
      const response = await api.post(`/ai/reviews/${review.id}/approve`, { approve: true }); 
      if (response.data.status === 'completed') { 
        toast.success(t('doctorDashboard.messages.aiApproveWithExplanation')); 
        handleViewAIResponse(response.data.ai_response); 
      } else { 
        toast.success(t('doctorDashboard.messages.aiApproveSuccess')); 
      } 
      fetchData(); 
    } catch (error) { 
      toast.error(t('doctorDashboard.messages.aiApproveError')); 
    } 
  };
  
  const handleRejectAI = async (review) => { 
    const reason = prompt(t('doctorDashboard.modals.rejectReasonPlaceholder')); 
    try { 
      await api.post(`/ai/reviews/${review.id}/approve`, { approve: false, reason }); 
      toast.success(t('doctorDashboard.messages.aiRejectSuccess')); 
      fetchData(); 
    } catch (error) { 
      toast.error(t('doctorDashboard.messages.aiRejectError')); 
    } 
  };

  const openPatientActionsModal = (patient) => { setSelectedActionPatient(patient); setShowPatientActionsModal(true); };
  
  const openMedicalRecordModal = (patient) => { 
    setSelectedPatientForRecord(patient); 
    setMedicalRecordData({ chief_complaint: '', diagnosis: '', treatment_plan: '', notes: '' }); 
    setShowMedicalRecordModal(true); 
  };

  // ================================================================
  // ===== دالة إضافة الكشف الطبي =====
  // ================================================================
  const handleAddMedicalRecord = async () => {
    console.log('📌 selectedPatientForRecord:', selectedPatientForRecord);
    
    // ✅ التحقق من وجود التشخيص
    if (!medicalRecordData.diagnosis || medicalRecordData.diagnosis.trim() === '') { 
      toast.error(t('doctorDashboard.messages.enterDiagnosis')); 
      return; 
    }
    
    // ✅ التحقق من وجود الشكوى الرئيسية
    if (!medicalRecordData.chief_complaint || medicalRecordData.chief_complaint.trim() === '') { 
      toast.error(t('doctorDashboard.messages.enterChiefComplaint')); 
      return; 
    }
    
    // ✅ التحقق من وجود المريض
    if (!selectedPatientForRecord?.id) {
      toast.error(t('doctorDashboard.messages.patientNotSelected'));
      console.error('❌ selectedPatientForRecord is invalid:', selectedPatientForRecord);
      return;
    }

    try { 
      const payload = {
        patient_id: Number(selectedPatientForRecord.id),
        chief_complaint: (medicalRecordData.chief_complaint || '').trim(),
        symptoms: medicalRecordData.symptoms || [],
        vital_signs: medicalRecordData.vital_signs || {},
        differential_diagnosis: medicalRecordData.differential_diagnosis || [],
        diagnosis: (medicalRecordData.diagnosis || '').trim(),
        treatment_plan: medicalRecordData.treatment_plan || '',
        notes: medicalRecordData.notes || '',
        is_chronic: medicalRecordData.is_chronic || false
      };
      
      console.log('📤 Sending medical record payload:', payload);
      
      await api.post('/patients/medical-records', payload); 
      toast.success(t('doctorDashboard.messages.medicalRecordAdded')); 
      setShowMedicalRecordModal(false); 
      setSelectedPatientForRecord(null); 
      fetchData(); 
    } catch (error) { 
      console.error('❌ Error adding medical record:', error);
      console.error('❌ Response data:', error.response?.data);
      const apiMessage = getApiErrorMessage(error);
      toast.error(apiMessage || t('doctorDashboard.messages.medicalRecordAddError'));
    }
  };

  const handleAddChronicDisease = async () => {
    if (!newChronicDisease.disease_name) { toast.error(t('doctorDashboard.messages.enterDiseaseName')); return; }
    try { const diagnosedDate = newChronicDisease.diagnosed_date ? new Date(newChronicDisease.diagnosed_date).toISOString() : new Date().toISOString(); await api.post(`/patients/${selectedChronicPatient.id}/chronic-diseases`, { disease_name: newChronicDisease.disease_name, diagnosed_date: diagnosedDate, notes: newChronicDisease.notes || "", is_active: true }); toast.success(t('doctorDashboard.messages.chronicAdded')); setNewChronicDisease({ disease_name: '', diagnosed_date: '', notes: '', is_active: true }); const response = await api.get(`/patients/${selectedChronicPatient.id}/chronic-diseases`); setChronicDiseases(response.data); }
    catch (error) { toast.error(getApiErrorMessage(error) || t('doctorDashboard.messages.chronicAddError')); }
  };

  const handleDeleteChronicDisease = async (diseaseId) => {
    if (!window.confirm(t('doctorDashboard.messages.confirmDeleteChronic'))) return;
    try { await api.delete(`/patients/${selectedChronicPatient.id}/chronic-diseases/${diseaseId}`); toast.success(t('doctorDashboard.messages.chronicDeleted')); const response = await api.get(`/patients/${selectedChronicPatient.id}/chronic-diseases`); setChronicDiseases(response.data); }
    catch (error) { toast.error(t('doctorDashboard.messages.chronicDeleteError')); }
  };

  useEffect(() => { fetchData(); }, []);
  
  const openModal = (type, item = null) => { 
    setModalType(type); 
    setSelectedItem(item);
    // Reset requestData when opening modal from requests tab
    if (type === 'prescription' || type === 'lab' || type === 'radiology') {
      setRequestData({
        ...requestData,
        patient_id: '',
        patient_name: '',
        medications: '',
        instructions: '',
        test_type: '',
        test_name: '',
        scan_type: '',
        body_part: '',
        description: '',
        amount: ''
      });
    }
    setShowModal(true); 
  };

  const detailsTabs = [
    { id: 'summary', label: `📊 ${t('doctorDashboard.detailsTabs.summary')}`, icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'records', label: `📋 ${t('doctorDashboard.detailsTabs.records')}`, icon: <DocumentTextIcon className="w-4 h-4" /> },
    { id: 'chronic', label: `❤️ ${t('doctorDashboard.detailsTabs.chronic')}`, icon: <HeartIcon className="w-4 h-4" /> },
    { id: 'lab', label: `🔬 ${t('doctorDashboard.detailsTabs.lab')}`, icon: <BeakerIcon className="w-4 h-4" /> },
    { id: 'radiology', label: `📷 ${t('doctorDashboard.detailsTabs.radiology')}`, icon: <CameraIcon className="w-4 h-4" /> },
    { id: 'prescriptions', label: `💊 ${t('doctorDashboard.detailsTabs.prescriptions')}`, icon: <BeakerIcon className="w-4 h-4" /> },
    { id: 'appointments', label: `📅 ${t('doctorDashboard.detailsTabs.appointments')}`, icon: <CalendarIcon className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (<Layout><div className="flex flex-col items-center justify-center h-80 gap-4"><div className="relative"><div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-900"></div><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400 absolute top-0 left-0"></div></div><p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('doctorDashboard.loading')}</p></div></Layout>);
  }

  const actionOptions = [
    { value: 'advice', label: `💊 ${t('doctorDashboard.actionOptions.medicalAdvice')}` }, { value: 'diagnosis', label: `📋 ${t('doctorDashboard.actionOptions.diagnosis')}` },
    { value: 'appointment', label: `📅 ${t('doctorDashboard.actionOptions.appointmentRequest')}` }, { value: 'lab', label: `🔬 ${t('doctorDashboard.actionOptions.lab')}` },
    { value: 'radiology', label: `📷 ${t('doctorDashboard.actionOptions.radiology')}` }, { value: 'prescription', label: `💊 ${t('doctorDashboard.actionOptions.prescription')}` },
  ];

  const activeComplaints = complaints.filter(c => !c.replied_status && c.status !== 'replied');
  
  const getComplaintStatusBadge = (c) => {
    if (c.replied_status || c.status === 'replied') return <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl font-bold">✓ {t('doctorDashboard.complaints.replied')}</span>;
    if (c.status === 'in_review') return <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl font-bold">⏳ {t('doctorDashboard.complaints.inReview')}</span>;
    return <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-xl font-bold">🔴 {t('doctorDashboard.complaints.new')}</span>;
  };
  
  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-900 dark:via-blue-900 dark:to-cyan-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>
          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20"><span className="text-4xl">👨‍⚕️</span></div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t('doctorDashboard.header.greeting', { name: user?.username || user?.name })}</h1>
                <p className="text-blue-100 mt-2 text-lg flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>{t('doctorDashboard.header.subtitle')}</p>
              </div>
            </div>
            <button onClick={fetchData} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/20 hover:scale-105 active:scale-95">
              <ArrowPathIcon className="w-5 h-5" /> {t('doctorDashboard.actions.refresh')}
            </button>
          </div>
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: t('doctorDashboard.stats.myPatients'), count: patients.length, icon: '👥', color: 'from-blue-400/20 to-blue-500/20' },
              { label: t('doctorDashboard.stats.medicalRecords'), count: appointments.length, icon: '📋', color: 'from-emerald-400/20 to-emerald-500/20' },
              { label: t('doctorDashboard.stats.todayAppointments'), count: appointments.filter(a => a.scheduled_date && new Date(a.scheduled_date).toDateString() === new Date().toDateString() && a.status === 'approved').length, icon: '📅', color: 'from-purple-400/20 to-purple-500/20' },
              { label: t('doctorDashboard.stats.pendingAppointments'), count: appointments.filter(a => a.status === 'pending').length, icon: '⏳', color: 'from-amber-400/20 to-amber-500/20' },
              { label: t('doctorDashboard.stats.aiReviews'), count: aiReviews.length, icon: '🤖', color: 'from-pink-400/20 to-pink-500/20' },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/25 transition-all`}>
                <div className="flex items-center gap-3"><span className="text-2xl">{stat.icon}</span><div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-white/70 text-xs">{stat.label}</p></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'patients', label: t('doctorDashboard.tabs.patients'), count: patients.length, icon: '👥' },
              { id: 'appointments', label: t('doctorDashboard.tabs.appointments'), count: appointments.length, icon: '📅' },
              { id: 'requests', label: t('doctorDashboard.tabs.requests'), count: null, icon: '📋' },
              { id: 'complaints', label: t('doctorDashboard.tabs.complaints'), count: activeComplaints.length, icon: '💬' },
              { id: 'ai', label: t('doctorDashboard.tabs.ai'), count: aiReviews.length, icon: '🤖' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${selectedTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
                {tab.count !== null && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Patients Tab ===== */}
        {selectedTab === 'patients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map(p => (
              <div key={p.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-pointer" onClick={() => openPatientActionsModal(p)}>
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"></div>
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <UserCircleIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-lg">{p.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.email}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-medium">📋 {p.records_count || 0} {t('doctorDashboard.defaults.record')}</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <UsersIcon className="w-16 h-16 text-indigo-200 dark:text-indigo-800 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('doctorDashboard.empty.noPatients')}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== Appointments Tab ===== */}
        {selectedTab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <CalendarIcon className="w-16 h-16 text-blue-200 dark:text-blue-800 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('doctorDashboard.empty.noAppointments')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">📊 {t('doctorDashboard.appointments.summary')}:</span>
                  {[
                    { label: `⏳ ${t('doctorDashboard.appointments.status.pending')}: ${appointments.filter(a => a.status === 'pending').length}`, cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
                    { label: `✅ ${t('doctorDashboard.appointments.status.approved')}: ${appointments.filter(a => a.status === 'approved').length}`, cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
                    { label: `💰 ${t('doctorDashboard.appointments.status.paid')}: ${appointments.filter(a => a.status === 'paid').length}`, cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
                    { label: `👨‍⚕️ ${t('doctorDashboard.appointments.status.inProgress')}: ${appointments.filter(a => a.status === 'in_progress').length}`, cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
                    { label: `📅 ${t('doctorDashboard.appointments.status.today')}: ${appointments.filter(a => a.scheduled_date && new Date(a.scheduled_date).toDateString() === new Date().toDateString()).length}`, cls: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
                    { label: `📋 ${t('doctorDashboard.appointments.status.all')}: ${appointments.length}`, cls: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
                  ].map((b, i) => <span key={i} className={`inline-flex items-center border px-3 py-1.5 rounded-xl text-xs font-bold ${b.cls}`}>{b.label}</span>)}
                </div>

                {appointments.map(apt => {
                  const isExpanded = expandedAppointmentId === apt.id;
                  const isPending = apt.status === 'pending';
                  const isApproved = apt.status === 'approved';
                  const isPaid = apt.status === 'paid';
                  const isInProgress = apt.status === 'in_progress';
                  const isCompleted = apt.status === 'completed';
                  const isCancelled = apt.status === 'cancelled' || apt.status === 'rejected';
                  const isToday = apt.scheduled_date && new Date(apt.scheduled_date).toDateString() === new Date().toDateString();

                  return (
                    <div key={apt.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-blue-300 dark:border-blue-600 shadow-xl shadow-blue-500/10' : 'border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-700'}`}>
                      <div className={`h-1.5 ${
                        isPending ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400' : 
                        isApproved ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400' : 
                        isPaid ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400' :
                        isInProgress ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400' :
                        isCompleted ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400' : 
                        'bg-gradient-to-r from-red-400 via-rose-400 to-pink-400'
                      }`}></div>

                      <button onClick={() => toggleAppointmentExpand(apt.id)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 flex-shrink-0 ${
                            isExpanded ? (
                              isPending ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 
                              isApproved ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                              isPaid ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                              isInProgress ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                              isCompleted ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 
                              'bg-gradient-to-br from-red-500 to-rose-600'
                            ) : (
                              isPending ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40' : 
                              isApproved ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40' : 
                              isPaid ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40' :
                              isInProgress ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40' :
                              isCompleted ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40' : 
                              'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40'
                            )
                          }`}>
                            <span className="text-2xl">{isExpanded ? '📂' : isPending ? '⏳' : isApproved ? '✅' : isPaid ? '💰' : isInProgress ? '👨‍⚕️' : isCompleted ? '🎉' : '❌'}</span>
                          </div>
                          <div className="text-right">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{apt.patient_name}</h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {isToday ? `📅 ${t('doctorDashboard.appointments.status.today')}` : `📅 ${apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('ar-EG') : '-'}`}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                                isPending ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                                isApproved ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                                isPaid ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                isInProgress ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                                'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                              }`}>
                                {isPending ? `⏳ ${t('doctorDashboard.appointments.status.pending')}` : isApproved ? `✅ ${t('doctorDashboard.appointments.status.approved')}` : isPaid ? `💰 ${t('doctorDashboard.appointments.status.paid')}` : isInProgress ? `👨‍⚕️ ${t('doctorDashboard.appointments.status.inProgress')}` : isCompleted ? `🎉 ${t('doctorDashboard.appointments.status.completed')}` : `❌ ${t('doctorDashboard.appointments.status.cancelled')}`}
                              </span>
                              {isPending && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                              {isPaid && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
                            </div>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${isExpanded ? 'bg-blue-100 dark:bg-blue-900/30 rotate-180' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </button>

                      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { icon: <UserCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />, label: t('doctorDashboard.appointments.patient'), value: apt.patient_name, bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
                              { icon: <CalendarDaysIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />, label: t('doctorDashboard.appointments.date'), value: apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : t('doctorDashboard.defaults.unspecified'), bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
                              { icon: <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />, label: t('doctorDashboard.appointments.time'), value: apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : t('doctorDashboard.defaults.unspecified'), bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
                            ].map((card, i) => (
                              <div key={i} className={`bg-gradient-to-r ${card.bg} rounded-xl p-4 border ${card.border} text-center`}>
                                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">{card.icon}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                                <p className="font-bold text-gray-800 dark:text-gray-100 mt-0.5 text-sm">{card.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-3">
                              <span className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-sm">💬</span>{t('doctorDashboard.appointments.complaint')}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 leading-relaxed">{apt.complaint || t('doctorDashboard.defaults.noComplaint')}</p>
                          </div>

                          <div className={`rounded-xl p-4 border ${
                            isPending ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30' : 
                            isApproved ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30' : 
                            isPaid ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30' :
                            isInProgress ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800/30' :
                            isCompleted ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800/30' : 
                            'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800/30'
                          }`}>
                            <p className={`text-lg font-bold ${
                              isPending ? 'text-amber-700 dark:text-amber-300' : 
                              isApproved ? 'text-emerald-700 dark:text-emerald-300' : 
                              isPaid ? 'text-blue-700 dark:text-blue-300' :
                              isInProgress ? 'text-purple-700 dark:text-purple-300' :
                              isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 
                              'text-red-700 dark:text-red-300'
                            }`}>
                              {isPending ? `⏳ ${t('doctorDashboard.appointments.statusDesc.pending')}` : 
                               isApproved ? `✅ ${t('doctorDashboard.appointments.statusDesc.approved')}` : 
                               isPaid ? `💰 ${t('doctorDashboard.appointments.statusDesc.paid')}` :
                               isInProgress ? `👨‍⚕️ ${t('doctorDashboard.appointments.statusDesc.inProgress')}` :
                               isCompleted ? `🎉 ${t('doctorDashboard.appointments.statusDesc.completed')}` : 
                               `❌ ${t('doctorDashboard.appointments.statusDesc.cancelled')}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {isPending ? t('doctorDashboard.appointments.statusSubDesc.pending') : 
                               isApproved ? t('doctorDashboard.appointments.statusSubDesc.approved') : 
                               isPaid ? t('doctorDashboard.appointments.statusSubDesc.paid') :
                               isInProgress ? t('doctorDashboard.appointments.statusSubDesc.inProgress') :
                               isCompleted ? t('doctorDashboard.appointments.statusSubDesc.completed') : 
                               t('doctorDashboard.appointments.statusSubDesc.cancelled')}
                            </p>
                          </div>

                          {/* ===== قسم الدفع ===== */}
                          {isPaid && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">💰 {t('doctorDashboard.appointments.paidAmount', { fee: apt.fee || 200 })}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorDashboard.appointments.waitingEntry')}</p>
                                </div>
                                <button 
                                  onClick={() => handleConfirmEntry(apt.id)}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                  {t('doctorDashboard.appointments.actions.confirmEntry')}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ===== قسم الكشف - إجراءات إضافة البيانات ===== */}
                          {isInProgress && (
                            <div className="mt-4 space-y-3">
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">👨‍⚕️ {t('doctorDashboard.appointments.patientInConsultation')}</p>
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full font-medium">{t('doctorDashboard.appointments.status.inProgress')}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <button 
                                    onClick={() => openMedicalRecordModalForAppointment(apt)}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <DocumentTextIcon className="w-4 h-4" />
                                    {t('doctorDashboard.appointments.actions.medicalRecord')}
                                  </button>
                                  <button 
                                    onClick={() => openPrescriptionModalForAppointment(apt)}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <BeakerIcon className="w-4 h-4" />
                                    {t('doctorDashboard.appointments.actions.prescription')}
                                  </button>
                                  <button 
                                    onClick={() => openLabRequestModalForAppointment(apt)}
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <BeakerIcon className="w-4 h-4" />
                                    {t('doctorDashboard.appointments.actions.lab')}
                                  </button>
                                  <button 
                                    onClick={() => openRadiologyRequestModalForAppointment(apt)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <CameraIcon className="w-4 h-4" />
                                    {t('doctorDashboard.appointments.actions.radiology')}
                                  </button>
                                </div>
                                
                                <button 
                                  onClick={() => handleCompleteAppointment(apt.id)}
                                  className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                  {t('doctorDashboard.appointments.actions.complete')}
                                </button>
                              </div>
                            </div>
                          )}

                          {apt.notes && <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30"><h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">📝 {t('doctorDashboard.appointments.notes')}</h4><p className="text-gray-700 dark:text-gray-300 text-sm">{apt.notes}</p></div>}
                          {apt.reject_reason && <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30"><h4 className="font-bold text-red-600 dark:text-red-400 mb-2">🚫 {t('doctorDashboard.appointments.rejectReason')}</h4><p className="text-gray-700 dark:text-gray-300 text-sm">{apt.reject_reason}</p></div>}

                          {isPending && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-amber-300 dark:border-amber-700">
                              <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">⚡</span>{t('doctorDashboard.appointments.appointmentActions')}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button onClick={(e) => { e.stopPropagation(); handleApproveAppointment(apt); }} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95">
                                  <CheckCircleIcon className="w-5 h-5" /> {t('doctorDashboard.appointments.actions.approve')}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleReschedule(apt); }} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95">
                                  <PencilSquareIcon className="w-5 h-5" /> {t('doctorDashboard.appointments.actions.reschedule')}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRejectAppointment(apt); }} className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 active:scale-95">
                                  <XCircleIcon className="w-5 h-5" /> {t('doctorDashboard.appointments.actions.reject')}
                                </button>
                              </div>
                            </div>
                          )}

                          {isApproved && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                              <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">📋</span>{t('doctorDashboard.appointments.extraActions')}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={(e) => { e.stopPropagation(); handleReschedule(apt); }} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95">
                                  <PencilSquareIcon className="w-5 h-5" /> {t('doctorDashboard.appointments.actions.rescheduleAppointment')}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt); }} className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 active:scale-95">
                                  <TrashIcon className="w-5 h-5" /> {t('doctorDashboard.appointments.actions.cancelAppointment')}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2"><span className="text-xs text-gray-400">🆔</span><span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">#{apt.id}</span></div>
                            <span className="text-xs text-gray-400">{apt.created_at ? new Date(apt.created_at).toLocaleDateString('ar-EG') : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ===== Requests Tab ===== */}
        {selectedTab === 'requests' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'lab', icon: '🔬', label: t('doctorDashboard.requests.labTitle'), desc: t('doctorDashboard.requests.labDesc'), btn: t('doctorDashboard.requests.labBtn'), color: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
              { type: 'radiology', icon: '📷', label: t('doctorDashboard.requests.radiologyTitle'), desc: t('doctorDashboard.requests.radiologyDesc'), btn: t('doctorDashboard.requests.radiologyBtn'), color: 'from-purple-500 to-pink-500', bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-100 dark:border-purple-800/30' },
              { type: 'prescription', icon: '💊', label: t('doctorDashboard.requests.prescriptionTitle'), desc: t('doctorDashboard.requests.prescriptionDesc'), btn: t('doctorDashboard.requests.prescriptionBtn'), color: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
            ].map(req => (
              <div key={req.type} className={`bg-gradient-to-br ${req.bg} rounded-2xl shadow-lg border ${req.border} overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1`}>
                <div className={`h-1.5 bg-gradient-to-r ${req.color}`}></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md mb-4"><span className="text-3xl">{req.icon}</span></div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2">{req.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{req.desc}</p>
                  <button onClick={() => openModal(req.type)} className={`w-full bg-gradient-to-r ${req.color} text-white py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-all`}>{req.btn}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Complaints Tab ===== */}
        {selectedTab === 'complaints' && (
          <div className="space-y-4">
            {activeComplaints.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-orange-200 dark:text-orange-800 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('doctorDashboard.empty.noComplaints')}</p>
              </div>
            ) : activeComplaints.map(c => (
              <div key={c.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all overflow-hidden cursor-pointer" onClick={() => openComplaintModal(c)}>
                <div className="h-1.5 bg-gradient-to-r from-red-400 via-orange-400 to-amber-400"></div>
                <div className="p-5 flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">📢</span>
                      <p className="font-bold text-red-600 dark:text-red-400 text-lg">{c.title || t('doctorDashboard.defaults.complaint')}</p>
                      {getComplaintStatusBadge(c)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">{c.content}</p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-400"><span>👤 {c.patient_name || t('doctorDashboard.defaults.patient')}</span><span>📅 {new Date(c.created_at).toLocaleDateString('ar-EG')}</span></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openComplaintModal(c); }} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                    <SparklesIcon className="w-4 h-4" /> {t('doctorDashboard.complaints.replyWithAI')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== AI Tab ===== */}
        {selectedTab === 'ai' && (
          <div className="space-y-4">
            {aiReviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-16">
                <CpuChipIcon className="w-16 h-16 text-purple-200 dark:text-purple-800 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('doctorDashboard.empty.noAiReviews')}</p>
              </div>
            ) : aiReviews.map(review => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                <div className="h-1.5 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400"></div>
                <div className="p-5 flex justify-between items-start flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl flex items-center justify-center"><SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{review.patient_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-1.5">💬 {review.request_reason}</p>
                      <p className="text-xs text-gray-400 mt-2">📅 {new Date(review.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApproveAI(review)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 transition-all"><CheckIcon className="w-4 h-4" /> {t('doctorDashboard.ai.approve')}</button>
                    <button onClick={() => handleRejectAI(review)} className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-red-500/25 flex items-center gap-2 active:scale-95 transition-all"><XMarkIcon className="w-4 h-4" /> {t('doctorDashboard.ai.reject')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Custom DateTimePicker for Reschedule ===== */}
      {showRescheduleModal && rescheduleAppointment && (
        <DateTimePicker
          value=""
          onChange={(newDate) => confirmReschedule(newDate)}
          onClose={() => { setShowRescheduleModal(false); setRescheduleAppointment(null); }}
        />
      )}

      {/* ===== All Modals ===== */}

      {/* Patient Actions Modal */}
      {showPatientActionsModal && selectedActionPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPatientActionsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><UserCircleIcon className="w-6 h-6 text-white" /></div>
                  <div><h2 className="text-xl font-bold text-white">{selectedActionPatient.username}</h2><p className="text-blue-100 text-sm">{selectedActionPatient.email}</p></div>
                </div>
                <button onClick={() => setShowPatientActionsModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[
                { icon: <ChatBubbleLeftRightIcon className="w-5 h-5 text-red-500" />, label: t('doctorDashboard.patientActions.complaints'), desc: t('doctorDashboard.patientActions.complaintsDesc'), bg: 'hover:bg-red-50 dark:hover:bg-red-900/20', action: () => { setShowPatientActionsModal(false); handleViewPatientComplaints(selectedActionPatient); } },
                { icon: <HeartIcon className="w-5 h-5 text-emerald-500" />, label: t('doctorDashboard.patientActions.chronic'), desc: t('doctorDashboard.patientActions.chronicDesc'), bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20', action: () => { setShowPatientActionsModal(false); handleViewChronicDiseases(selectedActionPatient); } },
                { icon: <EyeIcon className="w-5 h-5 text-indigo-500" />, label: t('doctorDashboard.patientActions.details'), desc: t('doctorDashboard.patientActions.detailsDesc'), bg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20', action: () => { setShowPatientActionsModal(false); handleViewPatientDetails(selectedActionPatient); } },
                { icon: <DocumentTextIcon className="w-5 h-5 text-blue-500" />, label: t('doctorDashboard.patientActions.addRecord'), desc: t('doctorDashboard.patientActions.addRecordDesc'), bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', action: () => { setShowPatientActionsModal(false); openMedicalRecordModal(selectedActionPatient); } },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className={`w-full flex items-center gap-4 p-4 rounded-xl ${a.bg} transition-all text-right border border-transparent hover:border-gray-200 dark:hover:border-gray-700`}>
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">{a.icon}</div>
                  <div className="flex-1 text-right"><p className="font-semibold text-gray-800 dark:text-gray-100">{a.label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</p></div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {showMedicalRecordModal && selectedPatientForRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowMedicalRecordModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('doctorDashboard.medicalRecordModal.title')}</h3>
              <button onClick={() => setShowMedicalRecordModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm text-gray-500">{t('doctorDashboard.medicalRecordModal.patientLabel')}</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">👤 {selectedPatientForRecord.username}</p>
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.medicalRecordModal.chiefComplaint')}</label>
                <textarea 
                  className={inputClass} 
                  rows="2" 
                  placeholder={t('doctorDashboard.medicalRecordModal.chiefComplaintPlaceholder')} 
                  value={medicalRecordData.chief_complaint} 
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, chief_complaint: e.target.value})} 
                  required
                />
              </div>
              <div>
                <label className={`${labelClass} !text-red-600 dark:!text-red-400`}>{t('doctorDashboard.medicalRecordModal.diagnosis')} *</label>
                <textarea 
                  className={inputClass} 
                  rows="2" 
                  placeholder={t('doctorDashboard.medicalRecordModal.diagnosisPlaceholder')} 
                  value={medicalRecordData.diagnosis} 
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, diagnosis: e.target.value})} 
                  required
                />
              </div>
              <div><label className={labelClass}>{t('doctorDashboard.medicalRecordModal.treatmentPlan')}</label><textarea className={inputClass} rows="3" placeholder={t('doctorDashboard.medicalRecordModal.treatmentPlanPlaceholder')} value={medicalRecordData.treatment_plan} onChange={(e) => setMedicalRecordData({...medicalRecordData, treatment_plan: e.target.value})} /></div>
              <div><label className={labelClass}>{t('doctorDashboard.medicalRecordModal.notes')}</label><textarea className={inputClass} rows="2" placeholder={t('doctorDashboard.medicalRecordModal.notesPlaceholder')} value={medicalRecordData.notes} onChange={(e) => setMedicalRecordData({...medicalRecordData, notes: e.target.value})} /></div>
              <button onClick={handleAddMedicalRecord} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 active:scale-95 transition-all">💾 {t('doctorDashboard.medicalRecordModal.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Reply Modal */}
      {showComplaintModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowComplaintModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('doctorDashboard.complaintModal.title')}</h2>
              <button onClick={() => setShowComplaintModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-5 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="font-bold text-red-700 dark:text-red-400 text-lg mb-2">{t('doctorDashboard.complaintModal.from')} {selectedComplaint.patient_name}</p>
                {selectedComplaint.title && <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2"><span className="bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-lg">📌 {selectedComplaint.title}</span></p>}
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-red-800/30">{selectedComplaint.content}</p>
              </div>

              {selectedComplaint?.replies?.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-500" /> {t('doctorDashboard.complaintModal.previousReplies', { count: selectedComplaint.replies.length })}</p>
                  {selectedComplaint.replies.map((reply, idx) => (
                    <div key={reply.id || idx} className="border-r-4 border-indigo-400 pr-4 pb-3 mb-3">
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">👨‍⚕️ {t('doctorDashboard.defaults.doctorPrefix')} {reply.doctor_name}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2"><SparklesIcon className="w-5 h-5" /> {t('doctorDashboard.complaintModal.aiAnalysis')}</p>
                  {isAnalyzing && <div className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div><span className="text-xs text-purple-600">{t('doctorDashboard.complaintModal.analyzing')}</span></div>}
                </div>
                {aiAnalysis ? <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 text-sm">{aiAnalysis}</div> : !isAnalyzing && <p className="text-gray-500 italic text-sm">{t('doctorDashboard.complaintModal.notAnalyzed')}</p>}
              </div>

              <div className="space-y-4 bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('doctorDashboard.complaintModal.writeReply')}</h3>
                <div><label className={labelClass}>{t('doctorDashboard.complaintModal.replyType')}</label><select className={inputClass} value={replyAction} onChange={(e) => setReplyAction(e.target.value)}>{actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div><label className={labelClass}>{t('doctorDashboard.complaintModal.reply')}</label><textarea className={inputClass} rows="4" placeholder={t('doctorDashboard.complaintModal.replyPlaceholder')} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} /></div>
                {replyAction === 'lab' && <div><label className={labelClass}>{t('doctorDashboard.complaintModal.labType')}</label><input className={inputClass} placeholder={t('doctorDashboard.complaintModal.labTypePlaceholder')} value={replyDetails} onChange={(e) => setReplyDetails(e.target.value)} /></div>}
                {replyAction === 'radiology' && <div><label className={labelClass}>{t('doctorDashboard.complaintModal.radiologyType')}</label><input className={inputClass} placeholder={t('doctorDashboard.complaintModal.radiologyTypePlaceholder')} value={replyDetails} onChange={(e) => setReplyDetails(e.target.value)} /></div>}
                {replyAction === 'prescription' && <div><label className={labelClass}>{t('doctorDashboard.complaintModal.prescription')}</label><textarea className={inputClass} rows="3" placeholder={t('doctorDashboard.complaintModal.prescriptionPlaceholder')} value={replyDetails} onChange={(e) => setReplyDetails(e.target.value)} /></div>}
                {replyAction === 'appointment' && <div><label className={labelClass}>{t('doctorDashboard.complaintModal.suggestedDate')}</label><input type="datetime-local" className={inputClass} value={replyDetails} onChange={(e) => setReplyDetails(e.target.value)} /></div>}
                <button onClick={handleReplyToComplaint} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <PaperAirplaneIcon className="w-5 h-5" /> {t('doctorDashboard.complaintModal.sendReply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Response Modal */}
      {showAIResponseModal && selectedAIResponse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-purple-500" /> {t('doctorDashboard.aiResponseModal.title')}</h2>
              <button onClick={() => setShowAIResponseModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6"><div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30"><p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">{selectedAIResponse}</p></div></div>
          </div>
        </div>
      )}

      {/* ===== Lab Modal ===== */}
      {showModal && modalType === 'lab' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('doctorDashboard.labModal.title')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* ✅ عرض المريض بشكل ثابت */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorDashboard.labModal.patient')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">👤 {requestData.patient_name || t('doctorDashboard.defaults.notSelected')}</p>
              </div>
              
              <div>
                <label className={labelClass}>{t('doctorDashboard.labModal.labTech')}</label>
                <select 
                  className={inputClass} 
                  value={requestData.lab_tech_id} 
                  onChange={(e) => setRequestData({...requestData, lab_tech_id: e.target.value})}
                >
                  <option value="">{t('doctorDashboard.labModal.selectPlaceholder')}</option>
                  {labTechs.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.labModal.testType')}</label>
                <select 
                  className={inputClass} 
                  value={requestData.test_type} 
                  onChange={(e) => setRequestData({...requestData, test_type: e.target.value})}
                >
                  <option value="">{t('doctorDashboard.labModal.selectPlaceholder')}</option>
                  {labTests.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.labModal.testName')}</label>
                <input 
                  className={inputClass} 
                  value={requestData.test_name} 
                  placeholder={t('doctorDashboard.labModal.testNamePlaceholder')} 
                  onChange={(e) => setRequestData({...requestData, test_name: e.target.value})} 
                />
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.labModal.description')}</label>
                <textarea 
                  className={inputClass} 
                  rows="2" 
                  value={requestData.description} 
                  placeholder={t('doctorDashboard.labModal.descriptionPlaceholder')} 
                  onChange={(e) => setRequestData({...requestData, description: e.target.value})} 
                />
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.labModal.suggestedPrice')}</label>
                <input 
                  type="number" 
                  min="0" 
                  className={inputClass} 
                  value={requestData.amount} 
                  placeholder="0" 
                  onChange={(e) => setRequestData({...requestData, amount: e.target.value})} 
                />
              </div>
              <button 
                onClick={handleSendLabRequest} 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
              >
                {t('doctorDashboard.labModal.sendButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Radiology Modal ===== */}
      {showModal && modalType === 'radiology' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('doctorDashboard.radiologyModal.title')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* ✅ عرض المريض بشكل ثابت */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorDashboard.radiologyModal.patient')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">👤 {requestData.patient_name || t('doctorDashboard.defaults.notSelected')}</p>
              </div>
              
              <div>
                <label className={labelClass}>{t('doctorDashboard.radiologyModal.scanType')}</label>
                <select 
                  className={inputClass} 
                  value={requestData.scan_type} 
                  onChange={(e) => setRequestData({...requestData, scan_type: e.target.value})}
                >
                  <option value="">{t('doctorDashboard.radiologyModal.selectPlaceholder')}</option>
                  {radiologyScans.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.radiologyModal.bodyPart')}</label>
                <input 
                  className={inputClass} 
                  placeholder={t('doctorDashboard.radiologyModal.bodyPartPlaceholder')} 
                  value={requestData.body_part} 
                  onChange={(e) => setRequestData({...requestData, body_part: e.target.value})} 
                />
              </div>
              <button 
                onClick={handleSendRadiologyRequest} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
              >
                {t('doctorDashboard.radiologyModal.sendButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Prescription Modal ===== */}
      {showModal && modalType === 'prescription' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{t('doctorDashboard.prescriptionModal.title')}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* ✅ عرض المريض بشكل ثابت */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorDashboard.prescriptionModal.patient')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">👤 {requestData.patient_name || t('doctorDashboard.defaults.notSelected')}</p>
              </div>
              
              <div>
                <label className={labelClass}>{t('doctorDashboard.prescriptionModal.medications')}</label>
                <textarea 
                  className={inputClass} 
                  placeholder={t('doctorDashboard.prescriptionModal.medicationsPlaceholder')} 
                  rows="4" 
                  value={requestData.medications}
                  onChange={(e) => setRequestData({...requestData, medications: e.target.value})} 
                />
              </div>
              <div>
                <label className={labelClass}>{t('doctorDashboard.prescriptionModal.instructions')}</label>
                <textarea 
                  className={inputClass} 
                  placeholder={t('doctorDashboard.prescriptionModal.instructionsPlaceholder')} 
                  rows="2"
                  value={requestData.instructions}
                  onChange={(e) => setRequestData({...requestData, instructions: e.target.value})} 
                />
              </div>
              <button 
                onClick={handleSendPrescription} 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
              >
                {t('doctorDashboard.prescriptionModal.sendButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chronic Modal */}
      {showChronicModal && selectedChronicPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowChronicModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><HeartIcon className="w-6 h-6 text-red-500" /> {t('doctorDashboard.chronicModal.title', { name: selectedChronicPatient.username })}</h2>
              <button onClick={() => setShowChronicModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {chronicDiseases.length === 0 ? <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><HeartIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" /><p className="text-gray-500">{t('doctorDashboard.chronicModal.noData')}</p></div> : chronicDiseases.map(d => (
                <div key={d.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30 flex justify-between items-start">
                  <div><p className="font-bold text-red-700 dark:text-red-400">{d.disease_name}</p><p className="text-xs text-gray-500 mt-1">📅 {new Date(d.diagnosed_date).toLocaleDateString('ar-EG')}</p>{d.notes && <p className="text-sm text-gray-600 mt-1">📝 {d.notes}</p>}</div>
                  <button onClick={() => handleDeleteChronicDisease(d.id)} className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors ml-3 flex-shrink-0"><XMarkIcon className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">{t('doctorDashboard.chronicModal.addTitle')}</h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <input type="text" placeholder={t('doctorDashboard.chronicModal.diseaseNamePlaceholder')} className={inputClass} value={newChronicDisease.disease_name} onChange={(e) => setNewChronicDisease({...newChronicDisease, disease_name: e.target.value})} />
                  <input type="date" className={inputClass} value={newChronicDisease.diagnosed_date.split('T')[0]} onChange={(e) => setNewChronicDisease({...newChronicDisease, diagnosed_date: e.target.value})} />
                  <textarea placeholder={t('doctorDashboard.chronicModal.notesPlaceholder')} className={inputClass} rows="2" value={newChronicDisease.notes} onChange={(e) => setNewChronicDisease({...newChronicDisease, notes: e.target.value})} />
                  <button onClick={handleAddChronicDisease} className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5" /> {t('doctorDashboard.chronicModal.addButton')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Patient Details Modal ===== */}
      {showPatientDetailsModal && selectedPatientDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-indigo-500" /> 
                {selectedPatientDetails.username}
              </h2>
              <button onClick={() => setShowPatientDetailsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: `📧 ${t('doctorDashboard.patientDetails.email')}`, value: selectedPatientDetails.email || '-' },
                  { label: `📋 ${t('doctorDashboard.patientDetails.records')}`, value: patientMedicalRecords.length },
                  { label: `❤️ ${t('doctorDashboard.patientDetails.chronic')}`, value: patientChronicList.length },
                  { label: `💊 ${t('doctorDashboard.patientDetails.prescriptions')}`, value: patientPrescriptions.length },
                ].map((info, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30 text-center">
                    <p className="text-xs text-gray-500">{info.label}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 mt-1 text-lg">{info.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 p-1.5 flex gap-1 overflow-x-auto">
                {detailsTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveDetailsTab(tab.id)} 
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeDetailsTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                    {tab.icon}<span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* ===== Summary Tab ===== */}
              {activeDetailsTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 text-center">
                      <span className="text-2xl">📋</span>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{patientMedicalRecords.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.medicalRecords')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30 text-center">
                      <span className="text-2xl">❤️</span>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{patientChronicList.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.chronic')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 text-center">
                      <span className="text-2xl">💊</span>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{patientPrescriptions.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.prescriptions')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
                      <span className="text-2xl">🔬</span>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{patientLabResults.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.lab')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800/30 text-center">
                      <span className="text-2xl">📷</span>
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{patientRadiologyResults.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.radiology')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30 text-center">
                      <span className="text-2xl">📅</span>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{patientAppointments.length}</p>
                      <p className="text-xs text-gray-500">{t('doctorDashboard.summary.appointments')}</p>
                    </div>
                  </div>

                  {patientSummary && Object.keys(patientSummary).length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800/30">
                      <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                        <span>📊</span> {t('doctorDashboard.summary.medicalSummary')}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {patientSummary.total_visits && (
                          <p><span className="font-semibold">{t('doctorDashboard.summary.totalVisits')}:</span> {patientSummary.total_visits}</p>
                        )}
                        {patientSummary.last_visit && (
                          <p><span className="font-semibold">{t('doctorDashboard.summary.lastVisit')}:</span> {new Date(patientSummary.last_visit).toLocaleDateString('ar-EG')}</p>
                        )}
                        {patientSummary.common_diagnosis && (
                          <p><span className="font-semibold">{t('doctorSummary.commonDiagnosis')}:</span> {patientSummary.common_diagnosis}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== Records Tab ===== */}
              {activeDetailsTab === 'records' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400">{t('doctorDashboard.recordsTab.title')}</h4>
                    <button onClick={() => { setShowPatientDetailsModal(false); openMedicalRecordModal(selectedPatientDetails); }} 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-semibold active:scale-95">
                      <PlusIcon className="w-3 h-3" /> {t('doctorDashboard.recordsTab.add')}
                    </button>
                  </div>
                  {patientMedicalRecords.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.recordsTab.empty')}</p>
                  ) : (
                    patientMedicalRecords.map(r => (
                      <div key={r.id} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 mb-3">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">📋 {r.diagnosis}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">💬 {r.chief_complaint || t('doctorDashboard.defaults.noComplaint')}</p>
                        {r.treatment_plan && <p className="text-sm text-gray-500 mt-1">💊 {r.treatment_plan}</p>}
                        <p className="text-xs text-gray-400 mt-2">📅 {new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== Chronic Tab ===== */}
              {activeDetailsTab === 'chronic' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-red-600 dark:text-red-400">{t('doctorDashboard.chronicTab.title')}</h4>
                    <button onClick={() => setShowChronicFormInDetails(!showChronicFormInDetails)} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-semibold active:scale-95">
                      <PlusIcon className="w-3 h-3" /> {t('doctorDashboard.chronicTab.add')}
                    </button>
                  </div>
                  {showChronicFormInDetails && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl mb-4 space-y-3 border border-gray-100 dark:border-gray-700">
                      <input type="text" placeholder={t('doctorDashboard.chronicTab.diseaseNamePlaceholder')} className={inputClass} value={newChronicDiseaseInDetails.disease_name} onChange={(e) => setNewChronicDiseaseInDetails({...newChronicDiseaseInDetails, disease_name: e.target.value})} />
                      <input type="date" className={inputClass} value={newChronicDiseaseInDetails.diagnosed_date} onChange={(e) => setNewChronicDiseaseInDetails({...newChronicDiseaseInDetails, diagnosed_date: e.target.value})} />
                      <textarea placeholder={t('doctorDashboard.chronicTab.notesPlaceholder')} className={inputClass} rows="2" value={newChronicDiseaseInDetails.notes} onChange={(e) => setNewChronicDiseaseInDetails({...newChronicDiseaseInDetails, notes: e.target.value})} />
                      <div className="flex gap-2">
                        <button onClick={handleAddChronicDiseaseInDetails} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 rounded-xl font-semibold text-sm shadow-lg active:scale-95">{t('doctorDashboard.chronicTab.save')}</button>
                        <button onClick={() => setShowChronicFormInDetails(false)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{t('doctorDashboard.chronicTab.cancel')}</button>
                      </div>
                    </div>
                  )}
                  {patientChronicList.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.chronicTab.empty')}</p>
                  ) : (
                    patientChronicList.map(c => (
                      <div key={c.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30 flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-red-700 dark:text-red-400">{c.disease_name}</p>
                          <p className="text-xs text-gray-500 mt-1">📅 {new Date(c.diagnosed_date).toLocaleDateString('ar-EG')}</p>
                          {c.notes && <p className="text-xs text-gray-600 mt-1">📝 {c.notes}</p>}
                        </div>
                        <button onClick={() => handleDeleteChronicDiseaseInDetails(c.id)} 
                          className="w-7 h-7 bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== Lab Tab ===== */}
              {activeDetailsTab === 'lab' && (
                <div>
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-4">{t('doctorDashboard.labTab.title')}</h4>
                  {patientLabResults.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.labTab.empty')}</p>
                  ) : (
                    patientLabResults.map(l => (
                      <div key={l.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 mb-3">
                        <p className="font-bold text-blue-700 dark:text-blue-400">{l.test_name || l.test_type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📋 {l.test_type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('doctorDashboard.labTab.resultLabel')}: {l.result || t('doctorDashboard.defaults.underReview')}</p>
                        <p className="text-xs text-gray-400 mt-2">📅 {new Date(l.created_at || l.requested_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== Radiology Tab ===== */}
              {activeDetailsTab === 'radiology' && (
                <div>
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-4">{t('doctorDashboard.radiologyTab.title')}</h4>
                  {patientRadiologyResults.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.radiologyTab.empty')}</p>
                  ) : (
                    patientRadiologyResults.map(r => (
                      <div key={r.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 mb-3">
                        <p className="font-bold text-purple-700 dark:text-purple-400">{r.scan_type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📍 {r.body_part || t('doctorDashboard.defaults.unspecified')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('doctorDashboard.radiologyTab.resultLabel')}: {r.result || t('doctorDashboard.defaults.underReview')}</p>
                        <p className="text-xs text-gray-400 mt-2">📅 {new Date(r.created_at || r.requested_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== Prescriptions Tab ===== */}
              {activeDetailsTab === 'prescriptions' && (
                <div>
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4">{t('doctorDashboard.prescriptionsTab.title')}</h4>
                  {patientPrescriptions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.prescriptionsTab.empty')}</p>
                  ) : (
                    patientPrescriptions.map(p => (
                      <div key={p.id} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">💊 {p.medications}</p>
                            {p.instructions && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📝 {p.instructions}</p>}
                              <p className={`text-xs mt-2 font-semibold ${p.status === 'dispensed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {p.status === 'dispensed' ? t('doctorDashboard.prescriptionsTab.dispensed') : t('doctorDashboard.prescriptionsTab.pending')}
                              </p>
                          </div>
                          <span className="text-xs text-gray-400">📅 {new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== Appointments Tab ===== */}
              {activeDetailsTab === 'appointments' && (
                <div>
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-4">{t('doctorDashboard.appointmentsTab.title')}</h4>
                  {patientAppointments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">{t('doctorDashboard.appointmentsTab.empty')}</p>
                  ) : (
                    patientAppointments.map(a => (
                      <div key={a.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-purple-700 dark:text-purple-400">📅 {a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('ar-EG') : '-'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              🕐 {a.scheduled_date ? new Date(a.scheduled_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </p>
                            <p className={`text-xs mt-2 font-semibold ${
                              a.status === 'approved' ? 'text-emerald-600' : 
                              a.status === 'pending' ? 'text-amber-600' : 
                              a.status === 'paid' ? 'text-blue-600' :
                              a.status === 'in_progress' ? 'text-purple-600' :
                              a.status === 'completed' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {a.status === 'approved' ? `✅ ${t('doctorDashboard.appointments.status.approved')}` : 
                               a.status === 'pending' ? `⏳ ${t('doctorDashboard.appointments.status.pending')}` : 
                               a.status === 'paid' ? `💰 ${t('doctorDashboard.appointments.status.paid')}` :
                               a.status === 'in_progress' ? `👨‍⚕️ ${t('doctorDashboard.appointments.status.inProgress')}` :
                               a.status === 'completed' ? `🎉 ${t('doctorDashboard.appointments.status.completed')}` : `❌ ${t('doctorDashboard.appointments.status.cancelled')}`}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">📋 #{a.id}</span>
                        </div>
                        {a.notes && <p className="text-sm text-gray-500 mt-2 bg-white dark:bg-gray-800 rounded-lg p-2">📝 {a.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Complaints Modal */}
      {showPatientComplaintsModal && selectedPatientData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowPatientComplaintsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('doctorDashboard.patientComplaintsModal.title', { name: selectedPatientData.patient_name })}</h2>
              <button onClick={() => setShowPatientComplaintsModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedPatientData.complaints?.length === 0 ? <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('doctorDashboard.patientComplaintsModal.empty')}</p></div> : selectedPatientData.complaints.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className={`h-1 ${c.status === 'replied' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-sm">📢</span>
                      <p className="font-bold text-red-600 dark:text-red-400">{c.title}</p>
                      <span className={`text-xs px-3 py-1 rounded-xl font-bold border ${c.status === 'replied' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}>{c.status === 'replied' ? `✓ ${t('doctorDashboard.patientComplaintsModal.replied')}` : `⏳ ${t('doctorDashboard.patientComplaintsModal.inReview')}`}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 text-sm">{c.content}</p>
                    {c.replies?.length > 0 && (
                      <div className="mt-4 border-r-4 border-indigo-300 dark:border-indigo-600 pr-4">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">{t('doctorDashboard.patientComplaintsModal.replies')}:</p>
                        {c.replies.map((r, i) => (
                          <div key={r.id || i} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30 mb-2">
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">👨‍⚕️ {t('doctorDashboard.defaults.doctorPrefix')} {r.doctor_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DoctorDashboard;