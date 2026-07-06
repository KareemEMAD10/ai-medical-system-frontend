import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';  // 👈 أضف الـ import
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RadiologyTechDashboard from './pages/RadiologyTechDashboard';
import LabTechDashboard from './pages/LabTechDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import FinanceManagerDashboard from './pages/FinanceManagerDashboard';
import PatientsPage from './pages/PatientsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import DoctorsPage from './pages/DoctorsPage';
import PharmacyPage from './pages/PharmacyPage';
import LabPage from './pages/LabPage';
import RadiologyPage from './pages/RadiologyPage';
import AIReviewsPage from './pages/AIReviewsPage';
import FinancialPage from './pages/FinancialPage';
import ProfilePage from './pages/ProfilePage';
import BillingPage from './pages/BillingPage';
import NotFound from './pages/NotFound';

import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" />
            <Routes>
              {/* ===== Landing Page - الصفحة الرئيسية ===== */}
              <Route path="/" element={<LandingPage />} />
              
              {/* ===== Public Routes ===== */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* ===== Patient Dashboard ===== */}
              <Route path="/patient-dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Doctor Dashboard ===== */}
              <Route path="/doctor-dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Admin Dashboard ===== */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Finance Manager Dashboard ===== */}
              <Route path="/finance-manager" element={
                <ProtectedRoute allowedRoles={['finance_manager']}>
                  <FinanceManagerDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Radiology Tech Dashboard ===== */}
              <Route path="/radiology-tech-dashboard" element={
                <ProtectedRoute allowedRoles={['radiology_tech']}>
                  <RadiologyTechDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Lab Tech Dashboard ===== */}
              <Route path="/lab-tech-dashboard" element={
                <ProtectedRoute allowedRoles={['lab_tech']}>
                  <LabTechDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Pharmacist Dashboard ===== */}
              <Route path="/pharmacist-dashboard" element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <PharmacistDashboard />
                </ProtectedRoute>
              } />
              
              {/* ===== Profile - For All ===== */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              {/* ===== Admin Only ===== */}
              <Route path="/doctors" element={
                <ProtectedRoute requiredRole="admin">
                  <DoctorsPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Doctor & Admin ===== */}
              <Route path="/patients" element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <PatientsPage />
                </ProtectedRoute>
              } />
              <Route path="/patients/:id" element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <PatientDetailsPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Pharmacy - Doctor, Pharmacist, Admin, Patient ===== */}
              <Route path="/pharmacy" element={
                <ProtectedRoute allowedRoles={['doctor', 'pharmacist', 'admin', 'patient']}>
                  <PharmacyPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Lab - Doctor, Lab Tech, Admin, Patient ===== */}
              <Route path="/lab" element={
                <ProtectedRoute allowedRoles={['doctor', 'lab_tech', 'admin', 'patient']}>
                  <LabPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Radiology - Doctor, Radiology Tech, Admin, Patient ===== */}
              <Route path="/radiology" element={
                <ProtectedRoute allowedRoles={['doctor', 'radiology_tech', 'admin', 'patient']}>
                  <RadiologyPage />
                </ProtectedRoute>
              } />
              
              {/* ===== AI Reviews - Admin, Doctor, Patient ===== */}
              <Route path="/ai-reviews" element={
                <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
                  <AIReviewsPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Financial - All roles except patient ===== */}
              <Route path="/financial" element={
                <ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist', 'lab_tech', 'radiology_tech', 'finance_manager']}>
                  <FinancialPage />
                </ProtectedRoute>
              } />
              
              {/* ===== Billing - Patient only ===== */}
              <Route path="/billing" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <BillingPage />
                </ProtectedRoute>
              } />
              
              {/* ===== 404 ===== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;