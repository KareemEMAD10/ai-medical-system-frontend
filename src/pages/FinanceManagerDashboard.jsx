import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CurrencyDollarIcon, UserGroupIcon, ShoppingCartIcon, 
  BanknotesIcon, ArrowPathIcon, ClockIcon,
  PencilIcon, XCircleIcon, CalendarIcon,
  ChartBarIcon, CheckCircleIcon, ChartBarSquareIcon,
  DocumentTextIcon, BuildingOfficeIcon, BeakerIcon,
  CameraIcon, HeartIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const L = (key) => `financeManagerDashboard.labels.${key}`;
const T = (key) => `financeManagerDashboard.tabs.${key}`;
const M = (key) => `financeManagerDashboard.messages.${key}`;

const FinanceManagerDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [salaryData, setSalaryData] = useState({
    base_salary: 0,
    bonus_percent: 0,
    per_visit_rate: 0,
    per_service_rate: 0,
    notes: ''
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    roleDistribution: [],
    monthlyTrend: [],
    salaryStats: { max: 0, min: 0, avg: 0, total: 0 },
    departmentStats: {}
  });
  const [revenueSources, setRevenueSources] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const employeesRes = await api.get('/finance-manager/salaries');
      const employeesData = employeesRes.data || [];
      setEmployees(employeesData);
      
      const [summaryRes, payrollRes, stockRes, sourcesRes] = await Promise.all([
        api.get('/finance-manager/financial-summary'),
        api.get('/finance-manager/payroll'),
        api.get('/finance-manager/stock-requests'),
        api.get('/finance-manager/revenue/sources')
      ]);
      
      setSummary(summaryRes.data);
      setPayrolls(payrollRes.data || []);
      setStockRequests(stockRes.data || []);
      setRevenueSources(sourcesRes.data?.sources || []);
      
      analyzeData(employeesData, payrollRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('errors.loading_failed'));
    } finally {
      setLoading(false);
    }
  };

  const analyzeData = (employeesData, payrollsData) => {
    const roleMap = {};
    employeesData.forEach(emp => {
      const role = emp.role === 'doctor' ? t(L('role_doctor')) :
                   emp.role === 'pharmacist' ? t(L('role_pharmacist')) :
                   emp.role === 'lab_tech' ? t(L('role_lab_tech')) :
                   emp.role === 'radiology_tech' ? t(L('role_radiology_tech')) : t(L('role_other'));
      roleMap[role] = (roleMap[role] || 0) + 1;
    });
    
    const roleDistribution = Object.keys(roleMap).map(key => ({
      name: key,
      value: roleMap[key]
    }));

    const salaries = employeesData.filter(e => e.base_salary > 0).map(e => e.base_salary);
    const salaryStats = {
      total: salaries.reduce((a, b) => a + b, 0),
      average: salaries.length > 0 ? (salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
      max: salaries.length > 0 ? Math.max(...salaries) : 0,
      min: salaries.length > 0 ? Math.min(...salaries) : 0
    };

    const monthMap = {};
    payrollsData.forEach(p => {
      const key = `${p.year}-${p.month}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: key, total: 0, count: 0 };
      }
      monthMap[key].total += p.net_amount;
      monthMap[key].count += 1;
    });

    const monthlyTrend = Object.keys(monthMap).map(key => ({
      month: key,
      total: monthMap[key].total,
      average: monthMap[key].total / monthMap[key].count
    })).sort((a, b) => a.month.localeCompare(b.month));

    const departmentStats = {};
    employeesData.forEach(emp => {
      const dept = emp.role === 'doctor' ? t(L('dept_medicine')) :
                   emp.role === 'pharmacist' ? t(L('dept_pharmacy')) :
                   emp.role === 'lab_tech' ? t(L('dept_lab')) :
                   emp.role === 'radiology_tech' ? t(L('dept_radiology')) : t(L('dept_other'));
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, totalSalary: 0 };
      }
      departmentStats[dept].count += 1;
      departmentStats[dept].totalSalary += emp.base_salary || 0;
    });

    setAnalyticsData({
      roleDistribution,
      monthlyTrend,
      salaryStats,
      departmentStats
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveStock = async (id) => {
    try {
      await api.post(`/finance-manager/stock-requests/${id}/approve`);
      toast.success(t('finance.stock_approved'));
      fetchData();
    } catch (error) {
      toast.error(t('finance.stock_approved_failed'));
    }
  };

  const handleRejectStock = async (id) => {
    const reason = prompt(t('finance.confirm_reject'));
    if (reason === null) return;
    try {
      await api.post(`/finance-manager/stock-requests/${id}/reject?reason=${reason}`);
      toast.success(t('finance.stock_rejected'));
      fetchData();
    } catch (error) {
      toast.error(t('finance.stock_rejected_failed'));
    }
  };

  const handlePayPayroll = async (id) => {
    if (!confirm(t('finance.confirm_pay'))) return;
    try {
      await api.post(`/finance-manager/payroll/pay/${id}`);
      toast.success(t('finance.payroll_paid'));
      fetchData();
    } catch (error) {
      toast.error(t('finance.payroll_payment_failed'));
    }
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/finance-manager/salary/update/${selectedUser}`, salaryData);
      toast.success(t('finance.salary_updated'));
      setShowSalaryModal(false);
      setSelectedUser(null);
      setSalaryData({
        base_salary: 0,
        bonus_percent: 0,
        per_visit_rate: 0,
        per_service_rate: 0,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error(t('finance.salary_update_failed'));
    }
  };

  const openSalaryModal = (userId) => {
    setSelectedUser(userId);
    const employee = employees.find(e => e.user_id === userId);
    if (employee) {
      setSalaryData({
        base_salary: employee.base_salary || 0,
        bonus_percent: employee.bonus_percent || 0,
        per_visit_rate: employee.per_visit_rate || 0,
        per_service_rate: employee.per_service_rate || 0,
        notes: employee.notes || ''
      });
    }
    setShowSalaryModal(true);
  };

  const handleCalculatePayroll = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    if (!confirm(t('finance.confirm_payroll', { month, year }))) return;
    
    setIsCalculating(true);
    try {
      const response = await api.post(`/finance-manager/payroll/calculate?month=${month}&year=${year}`);
      if (response.data.already_calculated) {
        toast.success(t('finance.payroll_calculated', { month, year }));
      } else {
        toast.success(t('finance.payroll_calculated', { month, year }));
      }
      fetchData();
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error(error.response?.data?.detail || t('finance.payroll_calculation_failed'));
    } finally {
      setIsCalculating(false);
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'doctor': return t(L('role_doctor'));
      case 'pharmacist': return t(L('role_pharmacist'));
      case 'lab_tech': return t(L('role_lab_tech'));
      case 'radiology_tech': return t(L('role_radiology_tech'));
      default: return role;
    }
  };

  // ==================== Analytics Dashboard ====================
  const renderAnalyticsDashboard = () => {
    const totalEmployees = employees.length;
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.net_amount, 0);
    const paidPayroll = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.net_amount, 0);
    const pendingPayroll = payrolls.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.net_amount, 0);
    const cur = t(L('currency'));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <UserGroupIcon className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <p className="text-xs text-gray-500">{t(L('total_employees'))}</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <BanknotesIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-xs text-gray-500">{t(L('total_payroll'))}</p>
            <p className="text-2xl font-bold text-blue-600">{totalPayroll.toLocaleString()} {cur}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <CheckCircleIcon className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-xs text-gray-500">{t(L('paid'))}</p>
            <p className="text-2xl font-bold text-green-600">{paidPayroll.toLocaleString()} {cur}</p>
          </div>
          <div className="card text-center hover:shadow-lg transition-shadow">
            <ClockIcon className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-xs text-gray-500">{t(L('pending_payroll'))}</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingPayroll.toLocaleString()} {cur}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500">{t(L('highest_salary'))}</p>
            <p className="text-xl font-bold text-green-600">{analyticsData.salaryStats.max.toLocaleString()} {cur}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">{t(L('lowest_salary'))}</p>
            <p className="text-xl font-bold text-red-600">{analyticsData.salaryStats.min.toLocaleString()} {cur}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">{t(L('average_salary'))}</p>
            <p className="text-xl font-bold text-blue-600">{Math.round(analyticsData.salaryStats.average).toLocaleString()} {cur}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-primary-500" />
              {t(L('role_distribution'))}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBarSquareIcon className="w-5 h-5 text-blue-500" />
              {t(L('monthly_trend'))}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value?.toLocaleString()} ${cur}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#0088FE" strokeWidth={2} name={t(L('chart_total'))} />
                  <Line type="monotone" dataKey="average" stroke="#00C49F" strokeWidth={2} name={t(L('chart_average'))} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-purple-500" />
            {t(L('monthly_trend'))}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employees.filter(e => e.base_salary > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user_name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value?.toLocaleString()} ${cur}`} />
                <Legend />
                <Bar dataKey="base_salary" fill="#0088FE" name={t(L('chart_base_salary'))} />
                <Bar dataKey="bonus_percent" fill="#00C49F" name={t(L('chart_bonus_percent'))} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-orange-500" />
            {t(L('role_distribution'))}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-3 text-right">{t(L('dept_name'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('dept_emp_count'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('dept_total_salary'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('dept_avg_salary'))}</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(analyticsData.departmentStats).map((dept, i) => {
                  const stats = analyticsData.departmentStats[dept];
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{dept}</td>
                      <td className="py-3 px-3">{stats.count}</td>
                      <td className="py-3 px-3">{stats.totalSalary.toLocaleString()} {cur}</td>
                      <td className="py-3 px-3">{Math.round(stats.totalSalary / stats.count).toLocaleString()} {cur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-500" />
            {t(L('salary_details'))}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-3 text-right">{t(L('column_num'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_employee'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_role'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_base_salary'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_bonus_percent'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_bonus'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_total'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_month'))}</th>
                  <th className="py-3 px-3 text-right">{t(L('column_status'))}</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => {
                  const bonusAmount = p.bonus_amount || 0;
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{i+1}</td>
                      <td className="py-3 px-3 font-medium">{p.user_name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          p.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                          p.role === 'pharmacist' ? 'bg-purple-100 text-purple-700' :
                          p.role === 'lab_tech' ? 'bg-orange-100 text-orange-700' :
                          p.role === 'radiology_tech' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getRoleName(p.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold">{p.base_amount.toLocaleString()} {cur}</td>
                      <td className="py-3 px-3">{((bonusAmount / p.base_amount) * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-green-600">{bonusAmount.toLocaleString()} {cur}</td>
                      <td className="py-3 px-3 font-bold text-blue-600">{p.net_amount.toLocaleString()} {cur}</td>
                      <td className="py-3 px-3">{p.month}/{p.year}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status === 'paid' ? t(L('payroll_paid')) : t(L('payroll_pending'))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  const cur = t(L('currency'));
  const pendingStockCount = stockRequests.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BanknotesIcon className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold">{t(L('title'))}</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {user?.username}
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCalculatePayroll} 
              disabled={isCalculating}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CalendarIcon className="w-4 h-4" />
              {isCalculating ? t(L('calculating')) : t(L('calculate_payroll'))}
            </button>
            <button onClick={fetchData} className="btn-secondary">
              <ArrowPathIcon className="w-5 h-5 inline ml-1" /> 
              {t(L('refresh'))}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="space-y-4">
            {/* Main cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center hover:shadow-lg transition-shadow">
                <CurrencyDollarIcon className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-xs text-gray-500">{t(L('total_revenue'))}</p>
                <p className="text-2xl font-bold text-green-600">{summary.total_revenue?.toLocaleString()} {cur}</p>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <CurrencyDollarIcon className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-xs text-gray-500">{t(L('total_expenses'))}</p>
                <p className="text-2xl font-bold text-red-600">{summary.total_expenses?.toLocaleString()} {cur}</p>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <BanknotesIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-gray-500">{t(L('net_profit'))}</p>
                <p className={`text-2xl font-bold ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {summary.net_profit?.toLocaleString()} {cur}
                </p>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <ClockIcon className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-xs text-gray-500">{t(L('pending_payroll'))}</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending_payroll?.toLocaleString()} {cur}</p>
              </div>
            </div>

            {/* Revenue by source */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">💊</span>
                  <p className="text-xs text-gray-500">{t(L('pharmacy'))}</p>
                </div>
                <p className="text-xl font-bold text-blue-600">{summary.pharmacy_revenue?.toLocaleString()} {cur}</p>
              </div>
              <div className="card text-center bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-900/20 dark:to-emerald-800/20 border border-teal-200 dark:border-teal-800/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">🔬</span>
                  <p className="text-xs text-gray-500">{t(L('lab'))}</p>
                </div>
                <p className="text-xl font-bold text-teal-600">{summary.lab_revenue?.toLocaleString()} {cur}</p>
              </div>
              <div className="card text-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border border-purple-200 dark:border-purple-800/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">📷</span>
                  <p className="text-xs text-gray-500">{t(L('radiology'))}</p>
                </div>
                <p className="text-xl font-bold text-purple-600">{summary.radiology_revenue?.toLocaleString()} {cur}</p>
              </div>
              <div className="card text-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-800/20 border border-orange-200 dark:border-orange-800/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">🏥</span>
                  <p className="text-xs text-gray-500">{t(L('clinics'))}</p>
                </div>
                <p className="text-xl font-bold text-orange-600">{summary.records_revenue?.toLocaleString()} {cur}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-1">
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('overview')}
          >
            {t(L('overview_tab'))}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'employees' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('employees')}
          >
            {t(L('employees_tab'), { count: employees.length })}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'payroll' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('payroll')}
          >
            {t(L('payroll_tab'), { count: payrolls.length })}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'stock' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('stock')}
          >
            {t(L('stock_tab'), { count: pendingStockCount })}
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg transition-all ${activeTab === 'analytics' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab('analytics')}
          >
            {t(L('analytics_tab'))}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-primary-500" />
                {t(L('latest_payroll'))}
              </h3>
              {payrolls.slice(0, 5).map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.user_name}</p>
                    <p className="text-xs text-gray-500">{p.month}/{p.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{p.net_amount} {cur}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status === 'paid' ? t(L('status_paid')) : t(L('status_pending'))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingCartIcon className="w-5 h-5 text-orange-500" />
                {t(L('pending_stock_requests'))}
              </h3>
              {stockRequests.filter(r => r.status === 'pending').slice(0, 5).map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{r.item_name}</p>
                    <p className="text-xs text-gray-500">{t(L('quantity'))} {r.requested_quantity}</p>
                    <p className="text-xs text-gray-400">{t(L('from'))} {r.pharmacy_name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleApproveStock(r.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                      {t(L('approve'))}
                    </button>
                    <button 
                      onClick={() => handleRejectStock(r.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      {t(L('reject'))}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-3 text-right">{t(L('column_num'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_employee'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_role'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_base_salary'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_bonus_percent'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_visit_rate'))}</th>
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.user_id || i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{i+1}</td>
                      <td className="py-3 px-3 font-medium">{emp.user_name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          emp.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                          emp.role === 'pharmacist' ? 'bg-purple-100 text-purple-700' :
                          emp.role === 'lab_tech' ? 'bg-orange-100 text-orange-700' :
                          emp.role === 'radiology_tech' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getRoleName(emp.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold">{emp.base_salary} {cur}</td>
                      <td className="py-3 px-3">{emp.bonus_percent}%</td>
                      <td className="py-3 px-3">{emp.per_visit_rate} {cur}</td>
                      <td className="py-3 px-3">
                        <button 
                          onClick={() => openSalaryModal(emp.user_id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                        >
                          <PencilIcon className="w-3 h-3" />
                          {t(L('edit'))}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-3 text-right">{t(L('column_num'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_employee'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_month'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_base'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_bonus'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_total'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_status'))}</th>
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p, i) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{i+1}</td>
                      <td className="py-3 px-3 font-medium">{p.user_name}</td>
                      <td className="py-3 px-3">{p.month}/{p.year}</td>
                      <td className="py-3 px-3">{p.base_amount} {cur}</td>
                      <td className="py-3 px-3 text-green-600">{p.bonus_amount} {cur}</td>
                      <td className="py-3 px-3 font-bold">{p.net_amount} {cur}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status === 'paid' ? t(L('payroll_paid')) : t(L('payroll_pending'))}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.status === 'pending' && (
                          <button 
                            onClick={() => handlePayPayroll(p.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            {t(L('pay'))}
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

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-3 text-right">{t(L('column_num'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_item'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_quantity'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_requested_by'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_status'))}</th>
                    <th className="py-3 px-3 text-right">{t(L('column_date'))}</th>
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {stockRequests.map((r, i) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{i+1}</td>
                      <td className="py-3 px-3 font-medium">{r.item_name}</td>
                      <td className="py-3 px-3">{r.requested_quantity}</td>
                      <td className="py-3 px-3">{r.pharmacy_name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          r.status === 'approved' ? 'bg-green-100 text-green-700' :
                          r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {r.status === 'pending' ? t(L('stock_status_pending')) :
                           r.status === 'approved' ? t(L('stock_status_approved')) :
                           r.status === 'rejected' ? t(L('stock_status_rejected')) :
                           t(L('stock_status_delivered'))}
                        </span>
                      </td>
                      <td className="py-3 px-3">{new Date(r.requested_at).toLocaleDateString('ar-EG')}</td>
                      <td className="py-3 px-3">
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApproveStock(r.id)}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                              {t(L('approve'))}
                            </button>
                            <button 
                              onClick={() => handleRejectStock(r.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              {t(L('reject'))}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && renderAnalyticsDashboard()}
      </div>

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t(L('edit_salary'))}</h3>
              <button onClick={() => setShowSalaryModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateSalary} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t(L('base_salary_label'))}</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  value={salaryData.base_salary} 
                  onChange={(e) => setSalaryData({...salaryData, base_salary: parseFloat(e.target.value) || 0})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t(L('bonus_percent_label'))}</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  value={salaryData.bonus_percent} 
                  onChange={(e) => setSalaryData({...salaryData, bonus_percent: parseFloat(e.target.value) || 0})}
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t(L('visit_rate_label'))}</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  value={salaryData.per_visit_rate} 
                  onChange={(e) => setSalaryData({...salaryData, per_visit_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t(L('service_rate_label'))}</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  value={salaryData.per_service_rate} 
                  onChange={(e) => setSalaryData({...salaryData, per_service_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t(L('notes_label'))}</label>
                <textarea 
                  className="input w-full" 
                  rows="2"
                  value={salaryData.notes} 
                  onChange={(e) => setSalaryData({...salaryData, notes: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                {t(L('save_changes'))}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FinanceManagerDashboard;
