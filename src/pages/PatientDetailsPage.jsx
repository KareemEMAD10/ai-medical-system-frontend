import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import PatientDetails from '../components/Patients/PatientDetails';
import MedicalRecordsList from '../components/Patients/MedicalRecordsList';
import MedicalRecordForm from '../components/Patients/MedicalRecordForm';
import Modal from '../components/Common/Modal';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const PatientDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // جلب بيانات المريض من الـ API
  const fetchPatientDetails = async () => {
    try {
      // جلب معلومات المريض الأساسية
      const patientRes = await api.get(`/users/${id}`);
      setPatient(patientRes.data);
      
      // جلب السجلات الطبية للمريض
      const recordsRes = await api.get(`/patients/${id}/medical-records`);
      setRecords(recordsRes.data || []);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error(t('patientDetailsPage.load_error'));
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  const handleAddRecord = async (data) => {
    try {
      await api.post('/patients/medical-records', {
        ...data,
        patient_id: parseInt(id)
      });
      toast.success(t('patientDetailsPage.record_added'));
      setIsRecordModalOpen(false);
      fetchPatientDetails(); // تحديث القائمة
    } catch (error) {
      console.error('Error adding record:', error);
      toast.error(t('patientDetailsPage.record_add_error'));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500">{t('patientDetailsPage.patient_not_found')}</p>
          <button onClick={() => navigate('/patients')} className="btn-primary mt-4">
            {t('patientDetailsPage.back_to_list')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t('patientDetailsPage.title')}
          </h1>
        </div>

        {/* Patient Info */}
        <PatientDetails patient={patient} />

        {/* Medical Records Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('patientDetailsPage.records_title')}</h2>
          {user?.role === 'doctor' && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {t('patientDetailsPage.add_record')}
            </button>
          )}
        </div>

        <MedicalRecordsList
          records={records}
          onView={(record) => console.log('View record:', record)}
          isLoading={isLoading}
        />

        {/* Add Record Modal */}
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          title={t('patientDetailsPage.add_record')}
        >
          <MedicalRecordForm onSubmit={handleAddRecord} />
        </Modal>
      </div>
    </Layout>
  );
};

export default PatientDetailsPage;