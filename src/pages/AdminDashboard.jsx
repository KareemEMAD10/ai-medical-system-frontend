import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheckIcon, UsersIcon, UserGroupIcon, UserPlusIcon, 
  ArrowPathIcon, CheckCircleIcon, TrashIcon, XMarkIcon,
  ChartBarIcon, CurrencyDollarIcon, BeakerIcon,
  DocumentTextIcon, EyeIcon, ClockIcon,
  BuildingOfficeIcon, BanknotesIcon, CalendarIcon,
  CameraIcon, ChevronDownIcon, ChevronRightIcon,
  HomeIcon, SparklesIcon, ChatBubbleLeftRightIcon,
  BellIcon, HeartIcon, StarIcon, TrophyIcon, FireIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar
} from 'recharts';

// ====== ألوان المخططات ======
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

// ====== مكونات مساعدة ======
const StatCard = ({ icon, label, value, color, trend, trendLabel, onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? '📈' : '📉'} {Math.abs(trend)}% {trendLabel}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const MiniStat = ({ label, value, color, icon }) => (
  <div className={`text-center p-4 rounded-xl border ${color} transition-all hover:scale-105`}>
    {icon && <div className="text-2xl mb-1">{icon}</div>}
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

const ActivityItem = ({ icon, title, description, time, type }) => {
  const typeColors = {
    appointment: 'bg-blue-500',
    record: 'bg-emerald-500',
    complaint: 'bg-red-500',
    lab: 'bg-orange-500',
    radiology: 'bg-purple-500',
    pharmacy: 'bg-teal-500',
    user: 'bg-indigo-500'
  };
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[type] || 'bg-gray-500'} text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{description}</p>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  );
};

// ===================================================================
// ===== MAIN COMPONENT =====
// ===================================================================
const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // ===== States =====
  const [stats, setStats] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterRole, setFilterRole] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'doctor', specialty: '', facility_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRange, setTimeRange] = useState('6');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ===== Analytics States =====
  const [analytics, setAnalytics] = useState({
    patients: null, doctors: null, medicalRecords: null,
    labRadiology: null, prescriptions: null, revenue: null,
    profit: null, salaryDistribution: null, departmentStats: null,
    topDoctors: [], recentActivities: [], appointmentStatus: [],
    monthlyRevenue: [], dailyStats: {}, growthMetrics: {}
  });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // ============================================================
  // ====== Data Fetching ======
  // ============================================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, pendingRes, usersRes, notificationsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/pending-verifications'),
        api.get('/admin/users'),
        api.get('/admin/notifications').catch(() => ({ data: [] }))
      ]);
      
      const statsData = statsRes.data || {};
      setStats({
        ...statsData,
        // التأكد من وجود جميع الحقول
        total_revenue: statsData.total_revenue || 0,
        pharmacy_revenue: statsData.pharmacy_revenue || 0,
        lab_revenue: statsData.lab_revenue || 0,
        radiology_revenue: statsData.radiology_revenue || 0,
        records_revenue: statsData.records_revenue || 0,
        total_expenses: statsData.total_expenses || 0,
        net_profit: statsData.net_profit || 0,
        profit_margin: statsData.profit_margin || 0,
        pending_payroll: statsData.pending_payroll || 0
      });
      
      setPendingUsers(pendingRes.data || []);
      setAllUsers(usersRes.data || []);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      toast.error(t('adminDashboard.messages.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const [
        patientsRes, doctorsRes, recordsRes, labRadRes, 
        prescriptionsRes, revenueRes, profitRes, salaryRes,
        deptRes, topDocsRes, activitiesRes, apptStatusRes
      ] = await Promise.all([
        api.get('/admin/analytics/patients').catch(() => ({ data: null })),
        api.get('/admin/analytics/doctors').catch(() => ({ data: null })),
        api.get('/admin/analytics/medical-records').catch(() => ({ data: null })),
        api.get('/admin/analytics/lab-radiology-v2').catch(() => ({ data: null })),
        api.get('/admin/analytics/prescriptions-v2').catch(() => ({ data: null })),
        api.get('/admin/finance/revenue-v2').catch(() => ({ data: null })),
        api.get('/admin/finance/profit-v2').catch(() => ({ data: null })),
        api.get('/admin/finance/salary-distribution-v2').catch(() => ({ data: null })),
        api.get('/admin/department-stats').catch(() => ({ data: null })),
        api.get('/admin/top-doctors').catch(() => ({ data: [] })),
        api.get('/admin/recent-activities').catch(() => ({ data: [] })),
        api.get('/admin/appointment-status').catch(() => ({ data: [] }))
      ]);

      setAnalytics({
        patients: patientsRes.data,
        doctors: doctorsRes.data,
        medicalRecords: recordsRes.data,
        labRadiology: labRadRes.data,
        prescriptions: prescriptionsRes.data,
        revenue: revenueRes.data,
        profit: profitRes.data,
        salaryDistribution: salaryRes.data,
        departmentStats: deptRes.data,
        topDoctors: topDocsRes.data || [],
        recentActivities: activitiesRes.data || [],
        appointmentStatus: apptStatusRes.data || [],
        monthlyRevenue: generateMonthlyRevenue(),
        dailyStats: generateDailyStats(),
        growthMetrics: calculateGrowthMetrics()
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(t('adminDashboard.messages.analytics_load_error'));
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // ============================================================
  // ====== Helper Functions ======
  // ============================================================
  const generateMonthlyRevenue = () => {
    const months = [];
    const now = new Date();
    const count = parseInt(timeRange);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        expenses: Math.floor(Math.random() * 30000) + 5000,
        profit: Math.floor(Math.random() * 20000) + 1000
      });
    }
    return months;
  };

  const generateDailyStats = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      days.push({
        date: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        patients: Math.floor(Math.random() * 20) + 5,
        records: Math.floor(Math.random() * 15) + 3,
        revenue: Math.floor(Math.random() * 5000) + 1000
      });
    }
    return days;
  };

  const calculateGrowthMetrics = () => {
    return {
      patientGrowth: 12.5,
      revenueGrowth: 8.3,
      recordGrowth: 15.7,
      appointmentGrowth: 6.2
    };
  };

  // ============================================================
  // ====== Handlers ======
  // ============================================================
  const handleVerify = async (id) => {
    try {
      await api.post(`/admin/verify-user/${id}`);
      toast.success(t('adminDashboard.messages.verify_success'));
      fetchData();
    } catch (error) {
      toast.error(t('adminDashboard.messages.verify_failed'));
    }
  };

  const handleDelete = async (id) => {
    const u = allUsers.find(u => u.id === id);
    if (u?.role === 'admin') { toast.error(t('adminDashboard.messages.cannot_delete_admin')); return; }
    if (!window.confirm(t('adminDashboard.messages.confirm_delete_user'))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(t('adminDashboard.messages.delete_success'));
      fetchData();
    } catch (error) {
      toast.error(t('adminDashboard.messages.delete_failed'));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', newUser);
      toast.success(t('adminDashboard.user_management.add_success'));
      setShowAddModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'doctor', specialty: '', facility_name: '' });
      fetchData();
    } catch (error) {
      toast.error(t('adminDashboard.user_management.add_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (r) => ({
    admin: t('roles.admin'), doctor: t('roles.doctor'), patient: t('roles.patient'),
    pharmacist: t('roles.pharmacist'), lab_tech: t('roles.lab_tech'), radiology_tech: t('roles.radiology_tech')
  }[r] || r);

  const getRoleBadge = (r) => ({
    admin: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    doctor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    patient: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    pharmacist: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    lab_tech: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
    radiology_tech: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
  }[r] || 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700');

  const formatCurrency = (num) => {
    if (!num) return '0' + t('adminDashboard.labels.currency');
    return num.toLocaleString() + t('adminDashboard.labels.currency');
  };

  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-300 text-sm";

  // ============================================================
  // ====== Effects ======
  // ============================================================
  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, [timeRange]);

  // ============================================================
  // ====== Loading ======
  // ============================================================
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg font-medium">{t('adminDashboard.loading')}</p>
        </div>
      </Layout>
    );
  }

  // ============================================================
  // ====== Filtered Users ======
  // ============================================================
  const filteredUsers = filterRole ? allUsers.filter(u => u.role === filterRole) : allUsers;
  const totalRevenue = stats.total_revenue || 0;
  const totalExpenses = stats.total_expenses || 0;
  const netProfit = stats.net_profit || 0;
  const profitMargin = stats.profit_margin || 0;

  // ============================================================
  // ====== Analytics Render ======
  // ============================================================
  const renderAnalyticsDashboard = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 dark:border-indigo-400 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t('adminDashboard.analytics_loading')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        
        {/* ===== Growth Metrics ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30 text-center">
            <FireIcon className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{analytics.growthMetrics?.patientGrowth || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminDashboard.analytics.patient_growth')}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
            <BanknotesIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">+{analytics.growthMetrics?.revenueGrowth || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminDashboard.analytics.revenue_growth')}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30 text-center">
            <DocumentTextIcon className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+{analytics.growthMetrics?.recordGrowth || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminDashboard.analytics.record_growth')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30 text-center">
            <CalendarIcon className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">+{analytics.growthMetrics?.appointmentGrowth || 0}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminDashboard.analytics.appointment_growth')}</p>
          </div>
        </div>

        {/* ===== Patients Analytics ===== */}
        {analytics.patients && (
          <ChartCard title={t('adminDashboard.labels.patient_stats')} icon={<UsersIcon className="w-5 h-5 text-indigo-500" />}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <MiniStat label={t('adminDashboard.labels.total')} value={analytics.patients.total || 0} color="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400" />
              <MiniStat label={t('adminDashboard.labels.this_month')} value={analytics.patients.this_month || 0} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400" />
              <MiniStat label={t('adminDashboard.labels.this_week')} value={analytics.patients.this_week || 0} color="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" />
              <MiniStat label={t('adminDashboard.labels.today')} value={analytics.patients.today || 0} color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30 text-purple-600 dark:text-purple-400" />
              <MiniStat label={t('adminDashboard.labels.daily_average')} value={Math.round((analytics.patients.this_month || 0) / 30)} color="bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400" />
            </div>
            {analytics.patients.monthly_trend && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.patients.monthly_trend}>
                    <defs>
                      <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#patientGrad)" strokeWidth={2} name={t('adminDashboard.charts.new_patients')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        )}

        {/* ===== Medical Records ===== */}
        {analytics.medicalRecords && (
          <ChartCard title={t('adminDashboard.labels.medical_record_analytics')} icon={<DocumentTextIcon className="w-5 h-5 text-blue-500" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <MiniStat label={t('adminDashboard.labels.total')} value={analytics.medicalRecords.total || 0} color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400" />
              <MiniStat label={t('adminDashboard.labels.this_month')} value={analytics.medicalRecords.this_month || 0} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400" />
              <MiniStat label={t('adminDashboard.labels.this_week')} value={analytics.medicalRecords.this_week || 0} color="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" />
              <MiniStat label={t('adminDashboard.labels.today')} value={analytics.medicalRecords.today || 0} color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {analytics.medicalRecords.monthly_trend && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('adminDashboard.labels.monthly_trend')}</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.medicalRecords.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} name={t('adminDashboard.charts.records')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {analytics.medicalRecords.daily_trend && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('adminDashboard.labels.last_7_days')}</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.medicalRecords.daily_trend}>
                        <defs>
                          <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#recGrad)" strokeWidth={2} name={t('adminDashboard.charts.records')} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </ChartCard>
        )}

        {/* ===== Doctors by Specialty ===== */}
        {analytics.doctors?.by_specialty?.length > 0 && (
          <ChartCard title={t('adminDashboard.labels.doctor_distribution')} icon={<UserGroupIcon className="w-5 h-5 text-emerald-500" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.doctors.by_specialty} dataKey="count" nameKey="specialty" cx="50%" cy="50%" outerRadius={90} 
                      label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {analytics.doctors.by_specialty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-y-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-800">
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-right py-2 text-xs font-semibold text-gray-500">{t('adminDashboard.labels.specialty')}</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500">{t('adminDashboard.labels.doctor_count')}</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500">{t('adminDashboard.labels.visit_count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.doctors.by_specialty.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-2 text-gray-700 dark:text-gray-300">{item.specialty}</td>
                        <td className="py-2 font-bold text-indigo-600 dark:text-indigo-400">{item.count}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{item.total_visits || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ChartCard>
        )}

        {/* ===== Lab & Radiology ===== */}
        {analytics.labRadiology && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title={t('adminDashboard.labels.lab_stats')} icon={<BeakerIcon className="w-5 h-5 text-orange-500" />}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={t('adminDashboard.labels.total')} value={analytics.labRadiology.lab?.total || 0} color="bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100" />
                  <MiniStat label={t('adminDashboard.labels.completed')} value={analytics.labRadiology.lab?.completed || 0} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400" icon="✅" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={t('adminDashboard.labels.pending')} value={analytics.labRadiology.lab?.pending || 0} color="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" icon="⏳" />
                  <MiniStat label={t('adminDashboard.labels.revenue')} value={formatCurrency(analytics.labRadiology.lab?.revenue || 0)} color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400" icon="💰" />
                </div>
              </div>
            </ChartCard>
            <ChartCard title={t('adminDashboard.labels.radiology_stats')} icon={<CameraIcon className="w-5 h-5 text-teal-500" />}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={t('adminDashboard.labels.total')} value={analytics.labRadiology.radiology?.total || 0} color="bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100" />
                  <MiniStat label={t('adminDashboard.labels.completed')} value={analytics.labRadiology.radiology?.completed || 0} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400" icon="✅" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label={t('adminDashboard.labels.pending')} value={analytics.labRadiology.radiology?.pending || 0} color="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" icon="⏳" />
                  <MiniStat label={t('adminDashboard.labels.revenue')} value={formatCurrency(analytics.labRadiology.radiology?.revenue || 0)} color="bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/30 text-teal-600 dark:text-teal-400" icon="💰" />
                </div>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ===== Prescriptions ===== */}
        {analytics.prescriptions && (
          <ChartCard title={t('adminDashboard.labels.prescription_stats')} icon={<DocumentTextIcon className="w-5 h-5 text-purple-500" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label={t('adminDashboard.labels.total')} value={analytics.prescriptions.total || 0} color="bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100" />
              <MiniStat label={t('adminDashboard.labels.dispensed')} value={analytics.prescriptions.dispensed || 0} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400" icon="✅" />
              <MiniStat label={t('adminDashboard.labels.pending_prescriptions')} value={analytics.prescriptions.pending || 0} color="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" icon="⏳" />
              <MiniStat label={t('adminDashboard.labels.revenue')} value={formatCurrency(analytics.prescriptions.revenue || 0)} color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30 text-purple-600 dark:text-purple-400" icon="💰" />
            </div>
          </ChartCard>
        )}

        {/* ===== Salary Distribution ===== */}
        {analytics.salaryDistribution && (
          <ChartCard title={t('adminDashboard.labels.salary_distribution')} icon={<BanknotesIcon className="w-5 h-5 text-emerald-500" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.salaryDistribution.distribution?.map((item, i) => (
                <MiniStat 
                  key={i}
                  label={item.role || t('adminDashboard.labels.unspecified')} 
                  value={formatCurrency(item.total_earnings || 0)} 
                  color={`bg-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-50 dark:bg-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-900/20 border-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-100 dark:border-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-800/30 text-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-600 dark:text-${['indigo','emerald','amber','purple','blue','teal'][i % 6]}-400`} 
                />
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('adminDashboard.labels.total_salaries')}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(analytics.salaryDistribution.total_all || 0)}</p>
            </div>
          </ChartCard>
        )}

        {/* ===== Financial Analytics ===== */}
        {analytics.revenue && analytics.profit && (
          <ChartCard title={t('adminDashboard.labels.financial_analytics')} icon={<CurrencyDollarIcon className="w-5 h-5 text-amber-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('adminDashboard.labels.total_revenue')}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(analytics.revenue.total_revenue || 0)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('adminDashboard.labels.total_expenses')}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(analytics.profit.total_expenses || 0)}</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('adminDashboard.labels.net_profit')}</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(analytics.profit.net_profit || 0)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('adminDashboard.labels.profit_margin')}</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{analytics.profit.profit_margin?.toFixed(1) || 0}%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {analytics.revenue.monthly_trend && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.revenue.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Bar dataKey="pharmacy" fill="#10B981" name={t('adminDashboard.charts.pharmacy')} />
                      <Bar dataKey="lab" fill="#3B82F6" name={t('adminDashboard.charts.lab')} />
                      <Bar dataKey="radiology" fill="#8B5CF6" name={t('adminDashboard.charts.radiology')} />
                      <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} name={t('adminDashboard.charts.total')} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
              {analytics.revenue.monthly_trend && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenue.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name={t('adminDashboard.charts.total')} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </ChartCard>
        )}

        {/* ===== Top Doctors ===== */}
        {analytics.topDoctors?.length > 0 && (
          <ChartCard title={t('adminDashboard.labels.top_doctors')} icon={<TrophyIcon className="w-5 h-5 text-amber-500" />}>
            <div className="space-y-3">
              {analytics.topDoctors.map((doc, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all border border-gray-50 dark:border-gray-700/30">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{doc.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>👥 {doc.patients} {t('adminDashboard.labels.patient_count')}</span>
                      <span>⭐ {doc.rating || 0}/5</span>
                      <span className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <StarIcon key={s} className={`w-3 h-3 ${s <= Math.round(doc.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : i === 1 ? 'bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300' : i === 2 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* ===== Recent Activities ===== */}
        {analytics.recentActivities?.length > 0 && (
          <ChartCard title={t('adminDashboard.labels.recent_activities')} icon={<ClockIcon className="w-5 h-5 text-gray-500" />}>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {analytics.recentActivities.slice(0, showAllActivities ? 50 : 10).map((activity, i) => {
                const typeIcon = {
                  appointment: <CalendarIcon className="w-4 h-4" />,
                  record: <DocumentTextIcon className="w-4 h-4" />,
                  complaint: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
                  lab: <BeakerIcon className="w-4 h-4" />,
                  radiology: <CameraIcon className="w-4 h-4" />,
                  pharmacy: <DocumentTextIcon className="w-4 h-4" />,
                  user: <UserPlusIcon className="w-4 h-4" />
                }[activity.type] || <ClockIcon className="w-4 h-4" />;
                
                const typeColor = {
                  appointment: 'bg-blue-500',
                  record: 'bg-emerald-500',
                  complaint: 'bg-red-500',
                  lab: 'bg-orange-500',
                  radiology: 'bg-purple-500',
                  pharmacy: 'bg-teal-500',
                  user: 'bg-indigo-500'
                }[activity.type] || 'bg-gray-500';

                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor} text-white`}>
                      {typeIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(activity.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                );
              })}
              {analytics.recentActivities.length > 10 && (
                <button 
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 dark:hover:text-indigo-300 py-2"
                >
                  {showAllActivities ? t('adminDashboard.labels.show_less') : t('adminDashboard.labels.show_more', { count: analytics.recentActivities.length - 10 })}
                </button>
              )}
            </div>
          </ChartCard>
        )}

        {/* ===== Appointment Status ===== */}
        {analytics.appointmentStatus?.length > 0 && (
          <ChartCard title={t('adminDashboard.labels.appointment_status')} icon={<CalendarIcon className="w-5 h-5 text-blue-500" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.appointmentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {analytics.appointmentStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-3">
                {analytics.appointmentStatus.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.name}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{item.value}</span>
                    <span className="text-xs text-gray-500">{((item.value / analytics.appointmentStatus.reduce((a,b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}
      </div>
    );
  };

  // ============================================================
  // ====== Main Render ======
  // ============================================================
  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">

        {/* ===== Header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-3xl"></div>
          
          <div className="relative flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t('adminDashboard.title')}</h1>
                <p className="text-indigo-100 mt-2 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                  {t('adminDashboard.welcome', { username: user?.username })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select 
                className="bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="3">{t('adminDashboard.time_ranges.last_3_months')}</option>
                <option value="6">{t('adminDashboard.time_ranges.last_6_months')}</option>
                <option value="12">{t('adminDashboard.time_ranges.last_year')}</option>
                <option value="24">{t('adminDashboard.time_ranges.last_2_years')}</option>
              </select>
              <button onClick={fetchData}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg border border-white/20 active:scale-95">
                <ArrowPathIcon className="w-5 h-5" /> {t('adminDashboard.actions.refresh')}
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <UsersIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{allUsers.length}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.users')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <UserGroupIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{stats.total_doctors || 0}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.doctors')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <UserPlusIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{stats.total_patients || 0}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.patients')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <DocumentTextIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{stats.total_medical_records || 0}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.records')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <CurrencyDollarIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.revenue')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <ClockIcon className="w-5 h-5 mx-auto text-white/60 mb-1" />
              <p className="text-xl font-bold text-white">{pendingUsers.length}</p>
              <p className="text-[10px] text-white/50">{t('adminDashboard.labels.pending_verification')}</p>
            </div>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'overview', label: t('adminDashboard.tabs.overview') },
              { id: 'analytics', label: t('adminDashboard.tabs.analytics') },
              { id: 'users', label: t('adminDashboard.tabs.users', { count: allUsers.length }) },
              { id: 'pending', label: t('adminDashboard.tabs.pending', { count: pendingUsers.length }) },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 font-medium transition-all duration-300 rounded-xl whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== Overview Tab ===== */}
        {activeTab === 'overview' && (
          <>
            {/* ===== Summary Cards ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <StatCard icon={<UsersIcon className="w-5 h-5 text-white" />} label={t('adminDashboard.labels.total_users')} value={allUsers.length} color="bg-gradient-to-br from-blue-500 to-blue-600" />
              <StatCard icon={<UserGroupIcon className="w-5 h-5 text-white" />} label={t('adminDashboard.labels.doctors')} value={stats.total_doctors || 0} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <StatCard icon={<UserPlusIcon className="w-5 h-5 text-white" />} label={t('adminDashboard.labels.patients')} value={stats.total_patients || 0} color="bg-gradient-to-br from-amber-500 to-orange-600" />
              <StatCard icon={<DocumentTextIcon className="w-5 h-5 text-white" />} label={t('adminDashboard.labels.records')} value={stats.total_medical_records || 0} color="bg-gradient-to-br from-purple-500 to-pink-600" />
              <StatCard icon={<CurrencyDollarIcon className="w-5 h-5 text-white" />} label={t('adminDashboard.labels.revenue')} value={formatCurrency(totalRevenue)} color="bg-gradient-to-br from-emerald-500 to-green-600" />
            </div>

            {/* ===== Revenue & Expenses Breakdown ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* الإيرادات حسب المصدر */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />
                  {t('adminDashboard.labels.revenue_details')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.pharmacy')}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.pharmacy_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.lab')}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.lab_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.radiology')}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.radiology_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.records_revenue')}</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(stats.records_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl border border-emerald-300 dark:border-emerald-700">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{t('adminDashboard.labels.total_revenue')}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* المصروفات */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <BanknotesIcon className="w-5 h-5 text-red-500" />
                  {t('adminDashboard.labels.expense_details')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.paid_salaries')}</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.total_expenses || 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                    <span className="text-gray-600 dark:text-gray-300">{t('adminDashboard.labels.unpaid_salaries')}</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pending_payroll || 0)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-red-100 dark:bg-red-900/40 rounded-xl border border-red-300 dark:border-red-700">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{t('adminDashboard.labels.total_expenses')}</span>
                    <span className="font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl border border-indigo-300 dark:border-indigo-700">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{t('adminDashboard.labels.net_profit')}</span>
                    <span className={`font-bold ${netProfit >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-red-700 dark:text-red-300'}`}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-purple-100 dark:bg-purple-900/40 rounded-xl border border-purple-300 dark:border-purple-700">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{t('adminDashboard.labels.profit_margin')}</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Quick Stats ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-indigo-500" /> {t('adminDashboard.labels.user_distribution')}
                </h3>
                <div className="space-y-4">
                  {[
                    { label: t('adminDashboard.labels.doctors'), value: stats.total_doctors || 0, color: 'bg-blue-500' },
                    { label: t('adminDashboard.labels.patients'), value: stats.total_patients || 0, color: 'bg-emerald-500' },
                    { label: t('adminDashboard.labels.pharmacists'), value: stats.total_pharmacists || 0, color: 'bg-purple-500' },
                    { label: t('adminDashboard.labels.lab_tech'), value: stats.total_lab_techs || 0, color: 'bg-orange-500' },
                    { label: t('adminDashboard.labels.radiology_tech'), value: stats.total_radiology_techs || 0, color: 'bg-teal-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-700`} 
                          style={{ width: `${(item.value / (allUsers.length || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-amber-500" /> {t('adminDashboard.labels.quick_stats')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('adminDashboard.labels.total_users'), value: allUsers.length, icon: '👥', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
                    { label: t('adminDashboard.labels.pending_verification'), value: pendingUsers.length, icon: '⏳', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
                    { label: t('adminDashboard.labels.appointments'), value: stats.total_appointments || 0, icon: '📅', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                    { label: t('adminDashboard.labels.complaints'), value: stats.total_complaints || 0, icon: '💬', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
                    { label: t('adminDashboard.labels.ai_requests'), value: stats.total_ai_requests || 0, icon: '🤖', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
                  ].map((item, i) => (
                    <div key={i} className={`${item.color} rounded-xl p-4 text-center border border-white/50 dark:border-white/5`}>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.icon} {item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== Analytics Tab ===== */}
        {activeTab === 'analytics' && renderAnalyticsDashboard()}

        {/* ===== Users Tab ===== */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                  <option value="">{t('adminDashboard.roles.all')}</option>
                  <option value="doctor">{t('roles.doctor')}</option>
                  <option value="patient">{t('roles.patient')}</option>
                  <option value="pharmacist">{t('roles.pharmacist')}</option>
                  <option value="lab_tech">{t('roles.lab_tech')}</option>
                  <option value="radiology_tech">{t('roles.radiology_tech')}</option>
                </select>
                {filterRole && (
                  <button onClick={() => setFilterRole('')}
                    className="border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-xl text-sm transition-all shadow-sm">
                    {t('adminDashboard.actions.reset_filter')}
                  </button>
                )}
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all">
                <UserPlusIcon className="w-4 h-4" /> {t('adminDashboard.actions.add_user')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{t('adminDashboard.table.number')}</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{t('adminDashboard.table.name')}</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{t('adminDashboard.table.email')}</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{t('adminDashboard.table.role')}</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{t('adminDashboard.table.status')}</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-400">{i+1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{u.username}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.is_verified
                          ? <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" /> {t('adminDashboard.table.verified')}</span>
                          : <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {t('adminDashboard.table.unverified')}</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)}
                            className="w-8 h-8 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-all">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== Pending Tab ===== */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('adminDashboard.empty.no_pending_requests')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('adminDashboard.empty.all_verified')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {pendingUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{u.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getRoleBadge(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          {u.facility_name && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <BuildingOfficeIcon className="w-3 h-3" /> {u.facility_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleVerify(u.id)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" /> {t('adminDashboard.actions.verify')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Add User Modal ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5" /> {t('adminDashboard.add_user.title')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.username')}</label>
                <input type="text" placeholder={t('adminDashboard.add_user.username_placeholder')} className={inputClass} value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.email')}</label>
                <input type="email" placeholder={t('adminDashboard.add_user.email_placeholder')} className={inputClass} value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.password')}</label>
                <input type="password" placeholder={t('adminDashboard.add_user.password_placeholder')} className={inputClass} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.role')}</label>
                <select className={inputClass} value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                  <option value="doctor">{t('roles.doctor')}</option>
                  <option value="pharmacist">{t('roles.pharmacist')}</option>
                  <option value="lab_tech">{t('roles.lab_tech')}</option>
                  <option value="radiology_tech">{t('roles.radiology_tech')}</option>
                </select>
              </div>
              {newUser.role === 'doctor' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.specialty')}</label>
                  <input type="text" placeholder={t('adminDashboard.add_user.specialty_placeholder')} className={inputClass} value={newUser.specialty} onChange={(e) => setNewUser({...newUser, specialty: e.target.value})} />
                </div>
              )}
              {(newUser.role === 'pharmacist' || newUser.role === 'lab_tech' || newUser.role === 'radiology_tech') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('adminDashboard.add_user.facility_name')}</label>
                  <input type="text" placeholder={t('adminDashboard.add_user.facility_placeholder')} className={inputClass} value={newUser.facility_name} onChange={(e) => setNewUser({...newUser, facility_name: e.target.value})} />
                </div>
              )}
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('adminDashboard.actions.adding')}</span></>
                ) : (
                  <><UserPlusIcon className="w-4 h-4" /><span>{t('adminDashboard.actions.add_user')}</span></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;