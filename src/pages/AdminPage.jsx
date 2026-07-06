import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheckIcon, UsersIcon, UserGroupIcon, UserPlusIcon, 
  ArrowPathIcon, CheckCircleIcon, TrashIcon, XMarkIcon,
  ChartBarIcon, CurrencyDollarIcon, CalendarIcon, BeakerIcon,
  DocumentTextIcon, HeartIcon, StarIcon, TrendingUpIcon,
  TrendingDownIcon, EyeIcon, ClockIcon, BriefcaseIcon,
  BuildingOfficeIcon, BanknotesIcon, PresentationChartLineIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

function AdminPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterRole, setFilterRole] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'doctor', specialty: '', facility_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    patients: null,
    doctors: null,
    medicalRecords: null,
    labRadiology: null,
    prescriptions: null,
    revenue: null,
    profit: null,
    salaryDistribution: null
  });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/pending-verifications'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setPendingUsers(pendingRes.data);
      setAllUsers(usersRes.data);
    } catch (error) {
      toast.error(t('errors.loading_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const [patientsRes, doctorsRes, recordsRes, labRadRes, prescriptionsRes, revenueRes, profitRes, salaryRes] = await Promise.all([
        api.get('/admin/analytics/patients').catch(() => ({ data: null })),
        api.get('/admin/analytics/doctors').catch(() => ({ data: null })),
        api.get('/admin/analytics/medical-records').catch(() => ({ data: null })),
        api.get('/admin/analytics/lab-radiology').catch(() => ({ data: null })),
        api.get('/admin/analytics/prescriptions').catch(() => ({ data: null })),
        api.get('/admin/finance/revenue').catch(() => ({ data: null })),
        api.get('/admin/finance/profit').catch(() => ({ data: null })),
        api.get('/admin/finance/salary-distribution').catch(() => ({ data: null }))
      ]);
      
      setAnalytics({
        patients: patientsRes.data,
        doctors: doctorsRes.data,
        medicalRecords: recordsRes.data,
        labRadiology: labRadRes.data,
        prescriptions: prescriptionsRes.data,
        revenue: revenueRes.data,
        profit: profitRes.data,
        salaryDistribution: salaryRes.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(t('errors.loading_failed'));
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/admin/verify-user/${id}`);
      toast.success(t('common.confirm'));
      fetchData();
    } catch (error) {
      toast.error(t('errors.loading_failed'));
    }
  };

  const handleDelete = async (id) => {
    const u = allUsers.find(u => u.id === id);
    if (u?.role === 'admin') { toast.error(t('errors.forbidden')); return; }
    if (!confirm(t('common.confirm'))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(t('common.delete'));
      fetchData();
    } catch (error) {
      toast.error(t('errors.loading_failed'));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', newUser);
      toast.success(t('common.save'));
      setShowAddModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'doctor', specialty: '', facility_name: '' });
      fetchData();
    } catch (error) {
      toast.error(t('errors.loading_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchAnalytics();
  }, []);

  const getRoleLabel = (r) => ({ 
    admin: t('roles.admin', { defaultValue: 'Admin' }),
    doctor: t('roles.doctor'),
    patient: t('roles.patient'),
    pharmacist: t('roles.pharmacist'),
    lab_tech: t('roles.lab_tech'),
    radiology_tech: t('roles.radiology_tech')
  }[r] || r);
  
  const getRoleColor = (r) => ({ 
    admin: 'bg-red-100 text-red-800', 
    doctor: 'bg-blue-100 text-blue-800', 
    patient: 'bg-green-100 text-green-800', 
    pharmacist: 'bg-purple-100 text-purple-800', 
    lab_tech: 'bg-orange-100 text-orange-800', 
    radiology_tech: 'bg-teal-100 text-teal-800' 
  }[r] || 'bg-gray-100 text-gray-800');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  const filteredUsers = filterRole ? allUsers.filter(u => u.role === filterRole) : allUsers;

  // Render Analytics Dashboard
  const renderAnalyticsDashboard = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* عنوان التحليلات */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PresentationChartLineIcon className="w-6 h-6 text-primary-500" />
            {t('admin.advanced_analytics')}
          </h2>
            <button onClick={fetchAnalytics} className="btn-secondary text-sm">
              <ArrowPathIcon className="w-4 h-4 inline ml-1" />
              {t('adminPage.actions.refresh')}
            </button>
        </div>

        {/* Patients Stats */}
        {analytics.patients && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary-500" />
              {t('admin.patient_stats')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics.patients.total || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.total_patients')}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics.patients.this_month || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.this_month')}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{analytics.patients.this_week || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.this_week')}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{analytics.patients.today || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.today')}</p>
              </div>
            </div>
            {analytics.patients.monthly_trend && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.patients.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} name={t('adminPage.labels.new_patients_count')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Medical Records Trends */}
        {analytics.medicalRecords && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500" />
              {t('admin.medical_record_analytics')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics.medicalRecords.total || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.total_records')}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics.medicalRecords.this_month || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.this_month')}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{analytics.medicalRecords.this_week || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.this_week')}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{analytics.medicalRecords.today || 0}</p>
                <p className="text-xs text-gray-500">{t('adminPage.labels.today')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.medicalRecords.monthly_trend && (
                <div className="h-80">
                  <h4 className="text-sm font-semibold mb-2 text-gray-600">{t('adminPage.labels.monthly_trend')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.medicalRecords.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" name={t('adminPage.labels.records_count')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {analytics.medicalRecords.daily_trend && (
                <div className="h-80">
                  <h4 className="text-sm font-semibold mb-2 text-gray-600">{t('adminPage.labels.daily_trend')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.medicalRecords.daily_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#00C49F" fill="#00C49F" fillOpacity={0.3} name={t('adminPage.labels.records_count')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Doctors by Specialty */}
        {analytics.doctors && analytics.doctors.by_specialty && analytics.doctors.by_specialty.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-green-500" />
              {t('adminPage.labels.doctor_distribution')}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.doctors.by_specialty}
                      dataKey="count"
                      nameKey="specialty"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.doctors.by_specialty.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2">{t('adminPage.labels.specialty')}</th>
                      <th className="text-right py-2">{t('adminPage.labels.doctor_count')}</th>
                      <th className="text-right py-2">{t('adminPage.labels.records_count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.doctors.by_specialty.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{item.specialty}</td>
                        <td className="py-2 font-semibold">{item.count}</td>
                        <td className="py-2">{item.total_visits || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Lab & Radiology Stats */}
        {analytics.labRadiology && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-orange-500" />
                {t('adminPage.labels.lab_stats')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>{t('adminPage.labels.total_lab')}</span>
                  <span className="font-bold text-xl">{analytics.labRadiology.lab?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>{t('adminPage.labels.completed')}</span>
                  <span className="font-bold text-green-600">{analytics.labRadiology.lab?.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span>{t('adminPage.labels.pending')}</span>
                  <span className="font-bold text-yellow-600">{analytics.labRadiology.lab?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span>{t('adminPage.labels.revenue')}</span>
                  <span className="font-bold text-blue-600">{analytics.labRadiology.lab?.revenue?.toLocaleString() || 0} {t('adminPage.labels.currency')}</span>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-teal-500" />
                {t('adminPage.labels.radiology_stats')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>{t('adminPage.labels.total_radiology')}</span>
                  <span className="font-bold text-xl">{analytics.labRadiology.radiology?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>{t('adminPage.labels.completed')}</span>
                  <span className="font-bold text-green-600">{analytics.labRadiology.radiology?.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span>{t('adminPage.labels.pending')}</span>
                  <span className="font-bold text-yellow-600">{analytics.labRadiology.radiology?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span>{t('adminPage.labels.revenue')}</span>
                  <span className="font-bold text-blue-600">{analytics.labRadiology.radiology?.revenue?.toLocaleString() || 0} {t('adminPage.labels.currency')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Analytics - Revenue & Profit */}
        {analytics.revenue && analytics.profit && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-yellow-500" />
              {t('adminPage.labels.financial_analytics')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('adminPage.labels.total_revenue')}</p>
                <p className="text-2xl font-bold text-green-600">{analytics.revenue.total_revenue?.toLocaleString() || 0} {t('adminPage.labels.currency')}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('adminPage.labels.total_expenses')}</p>
                <p className="text-2xl font-bold text-red-600">{analytics.profit.total_expenses?.toLocaleString() || 0} {t('adminPage.labels.currency')}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('adminPage.labels.net_profit')}</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.profit.net_profit?.toLocaleString() || 0} {t('adminPage.labels.currency')}</p>
                {analytics.profit.profit_margin && (
                  <p className="text-xs text-gray-500">{t('adminPage.labels.profit_margin')}: {analytics.profit.profit_margin.toFixed(1)}%</p>
                )}
              </div>
            </div>
            {analytics.revenue.monthly_trend && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenue.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value?.toLocaleString()} ${t('adminPage.labels.currency')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#0088FE" strokeWidth={2} name={t('adminPage.labels.total_revenue')} />
                    <Line type="monotone" dataKey="lab" stroke="#00C49F" name={t('adminPage.labels.lab_tests')} />
                    <Line type="monotone" dataKey="radiology" stroke="#FFBB28" name={t('adminPage.labels.radiology_name')} />
                    <Line type="monotone" dataKey="pharmacy" stroke="#FF8042" name={t('adminPage.labels.pharmacy')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Salary Distribution */}
        {analytics.salaryDistribution && analytics.salaryDistribution.distribution && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-purple-500" />
              {t('adminPage.labels.salary_distribution')}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.salaryDistribution.distribution}
                      dataKey="total_earnings"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => {
                        const roleName = name === 'doctor' ? t('roles.doctor') : name === 'pharmacist' ? t('roles.pharmacist') : name === 'lab_tech' ? t('roles.lab_tech') : name === 'radiology_tech' ? t('roles.radiology_tech') : name;
                        return `${roleName}: ${(percent * 100).toFixed(0)}%`;
                      }}
                    >
                      {analytics.salaryDistribution.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value?.toLocaleString()} ${t('adminPage.labels.currency')}`} />
                    <Legend formatter={(value) => {
                      return value === 'doctor' ? t('roles.doctor') : value === 'pharmacist' ? t('roles.pharmacist') : value === 'lab_tech' ? t('roles.lab_tech') : value === 'radiology_tech' ? t('roles.radiology_tech') : value;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2">{t('adminPage.labels.role')}</th>
                      <th className="text-right py-2">{t('adminPage.labels.total_earnings')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.salaryDistribution.distribution.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">
                          {t(`roles.${item.role}`, { defaultValue: item.role })}
                        </td>
                        <td className="py-2 font-semibold text-green-600">{item.total_earnings?.toLocaleString()} {t('adminPage.labels.currency')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold">
                      <td className="py-2">{t('adminPage.labels.total')}</td>
                      <td className="py-2 text-primary-600">{analytics.salaryDistribution.total_all?.toLocaleString()} {t('adminPage.labels.currency')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('adminPage.labels.admin_dashboard')}
            </h1>
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-dark-200 px-2 py-1 rounded">
              {user?.username}
            </span>
          </div>
          <button onClick={fetchData} className="btn-secondary">
            <ArrowPathIcon className="w-5 h-5 inline ml-1" /> 
            {t('adminPage.actions.refresh')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <UsersIcon className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <p className="text-xs text-gray-500">{t('adminPage.labels.users')}</p>
            <p className="text-2xl font-bold">{stats.total_users || 0}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <UserGroupIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-xs text-gray-500">{t('adminPage.labels.doctors')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_doctors || 0}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <UsersIcon className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-xs text-gray-500">{t('adminPage.labels.patients')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.total_patients || 0}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <UserPlusIcon className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-xs text-gray-500">{t('adminPage.labels.pending_verification')}</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-dark-200 overflow-x-auto pb-1">
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('overview')}
          >
            📊 {t('adminPage.tabs.overview')}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'analytics' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('analytics')}
          >
            📈 {t('adminPage.tabs.analytics')}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'users' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('users')}
          >
            👥 {t('adminPage.tabs.users', { count: allUsers.length })}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'pending' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('pending')}
          >
            ⏳ {t('adminPage.tabs.pending', { count: pendingUsers.length })}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-primary-500" />
                {t('adminPage.labels.user_distribution')}
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{t('adminPage.labels.doctors')}</span>
                    <span className="font-semibold">{stats.total_doctors || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((stats.total_doctors || 0) / (stats.total_users || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{t('adminPage.labels.patients')}</span>
                    <span className="font-semibold">{stats.total_patients || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((stats.total_patients || 0) / (stats.total_users || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{t('adminPage.labels.other_roles')}</span>
                    <span className="font-semibold">{stats.total_users - (stats.total_doctors || 0) - (stats.total_patients || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${((stats.total_users - (stats.total_doctors || 0) - (stats.total_patients || 0)) / (stats.total_users || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">{t('adminPage.labels.quick_stats')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-600">{allUsers.length}</p>
                  <p className="text-xs text-gray-500">{t('adminPage.labels.total_users')}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{pendingUsers.length}</p>
                  <p className="text-xs text-gray-500">{t('adminPage.labels.pending_verification')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.total_doctors || 0}</p>
                  <p className="text-xs text-gray-500">{t('adminPage.labels.doctors')}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.total_patients || 0}</p>
                  <p className="text-xs text-gray-500">{t('adminPage.labels.patients')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && renderAnalyticsDashboard()}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <div className="flex gap-2">
                <select className="input w-40" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="">{t('adminPage.labels.all_roles')}</option>
                  <option value="doctor">{t('roles.doctor')}</option>
                  <option value="patient">{t('roles.patient')}</option>
                  <option value="pharmacist">{t('roles.pharmacist')}</option>
                  <option value="lab_tech">{t('roles.lab_tech')}</option>
                  <option value="radiology_tech">{t('roles.radiology_tech')}</option>
                </select>
                {filterRole && (
                  <button onClick={() => setFilterRole('')} className="btn-secondary">
                    {t('adminPage.actions.reset_filter')}
                  </button>
                )}
              </div>
              <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5" />
                {t('adminPage.actions.add_user')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-dark-200">
                    <th className="py-3 px-3 text-right">#</th>
                    <th className="py-3 px-3 text-right">{t('adminPage.labels.name')}</th>
                    <th className="py-3 px-3 text-right">{t('adminPage.labels.email')}</th>
                    <th className="py-3 px-3 text-right">{t('adminPage.labels.role_short')}</th>
                    <th className="py-3 px-3 text-right">{t('adminPage.labels.status')}</th>
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-200">
                      <td className="py-3 px-3">{i+1}</td>
                      <td className="py-3 px-3 font-medium">{u.username}</td>
                      <td className="py-3 px-3 text-gray-600">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.is_verified ? (
                          <span className="text-green-600">{t('adminPage.labels.verified')}</span>
                        ) : (
                          <span className="text-yellow-600">{t('adminPage.labels.unverified')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="w-5 h-5" />
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

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="card">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400 mb-3" />
                <p className="text-gray-500 text-lg">{t('adminPage.labels.no_pending_requests')}</p>
                <p className="text-sm text-gray-400">{t('adminPage.labels.all_verified')}</p>
              </div>
            ) : (
              pendingUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200">
                  <div>
                    <p className="font-semibold text-lg">{u.username}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${getRoleColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                      {' | '}
                      {u.facility_name || t('adminPage.labels.no_facility')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleVerify(u.id)} 
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {t('adminPage.actions.verify')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-100 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t('adminPage.labels.add_user_title')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('adminPage.labels.username')}</label>
                <input 
                  type="text" 
                  placeholder={t('adminPage.labels.username_placeholder')} 
                  className="input w-full" 
                  value={newUser.username} 
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('adminPage.labels.email_label')}</label>
                <input 
                  type="email" 
                  placeholder={t('adminPage.labels.email_placeholder')} 
                  className="input w-full" 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('adminPage.labels.password')}</label>
                <input 
                  type="password" 
                  placeholder="********" 
                  className="input w-full" 
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('adminPage.labels.role_label')}</label>
                <select 
                  className="input w-full" 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="doctor">{t('roles.doctor')}</option>
                  <option value="pharmacist">{t('roles.pharmacist')}</option>
                  <option value="lab_tech">{t('roles.lab_tech')}</option>
                  <option value="radiology_tech">{t('roles.radiology_tech')}</option>
                </select>
              </div>
              {newUser.role === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('adminPage.labels.specialty')}</label>
                  <input 
                    type="text" 
                    placeholder={t('adminPage.labels.specialty_placeholder')} 
                    className="input w-full" 
                    value={newUser.specialty} 
                    onChange={(e) => setNewUser({...newUser, specialty: e.target.value})} 
                  />
                </div>
              )}
              {(newUser.role === 'pharmacist' || newUser.role === 'lab_tech' || newUser.role === 'radiology_tech') && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('adminPage.labels.facility_name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('adminPage.labels.facility_placeholder')} 
                    className="input w-full" 
                    value={newUser.facility_name} 
                    onChange={(e) => setNewUser({...newUser, facility_name: e.target.value})} 
                  />
                </div>
              )}
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary w-full py-2 disabled:opacity-50"
              >
                {isSubmitting ? t('adminPage.actions.adding') : t('adminPage.actions.add_user')}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminPage;