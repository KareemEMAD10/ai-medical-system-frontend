import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import PatientDetails from '../components/Patients/PatientDetails';
import Modal from '../components/Common/Modal';
import { EyeIcon, UserCircleIcon, PlusIcon, HeartIcon, DocumentTextIcon, BeakerIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PatientsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientChronic, setPatientChronic] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState('records');
  const [patientLabResults, setPatientLabResults] = useState([]);
  const [patientRadiologyResults, setPatientRadiologyResults] = useState([]);
  const [showChronicForm, setShowChronicForm] = useState(false);
  const [newChronicDisease, setNewChronicDisease] = useState({
    disease_name: '',
    diagnosed_date: '',
    notes: '',
    is_active: true
  });

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/doctors/my-patients');
      setPatients(res.data);
    } catch (error) {
      toast.error(t('patients.errors.load_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const [recordsRes, chronicRes] = await Promise.all([
        api.get(`/patients/${patientId}/medical-records`).catch(() => ({ data: [] })),
        api.get(`/patients/${patientId}/chronic-diseases`).catch(() => ({ data: [] }))
      ]);
      setPatientRecords(recordsRes.data || []);
      setPatientChronic(chronicRes.data || []);
      setPatientLabResults([]);
      setPatientRadiologyResults([]);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setActiveDetailsTab('records');
    setShowChronicForm(false);
    setNewChronicDisease({ disease_name: '', diagnosed_date: '', notes: '', is_active: true });
    await fetchPatientDetails(patient.id);
    setIsModalOpen(true);
  };

  const handleAddChronicDisease = async () => {
    if (!newChronicDisease.disease_name) {
      toast.error(t('patients.errors.disease_name_required'));
      return;
    }
    
    try {
      const diagnosedDate = newChronicDisease.diagnosed_date 
        ? new Date(newChronicDisease.diagnosed_date).toISOString() 
        : new Date().toISOString();
        
      await api.post(`/patients/${selectedPatient.id}/chronic-diseases`, {
        disease_name: newChronicDisease.disease_name,
        diagnosed_date: diagnosedDate,
        notes: newChronicDisease.notes || "",
        is_active: true
      });
      toast.success(t('patients.errors.disease_added_success'));
      setNewChronicDisease({ disease_name: '', diagnosed_date: '', notes: '', is_active: true });
      setShowChronicForm(false);
      await fetchPatientDetails(selectedPatient.id);
    } catch (error) {
      console.error('Error adding disease:', error);
      toast.error(error.response?.data?.detail || t('patients.errors.disease_add_failed'));
    }
  };

  const handleDeleteChronicDisease = async (diseaseId) => {
    if (!window.confirm(t('patients.confirm_delete_disease'))) return;
    
    try {
      await api.delete(`/patients/${selectedPatient.id}/chronic-diseases/${diseaseId}`);
      toast.success(t('patients.disease_deleted_success'));
      await fetchPatientDetails(selectedPatient.id);
    } catch (error) {
      toast.error(t('patients.disease_delete_failed'));
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const tabs = [
    { id: 'records', label: t('patients.records_tab'), icon: <DocumentTextIcon className="w-4 h-4" /> },
    { id: 'chronic', label: t('patients.chronic_tab'), icon: <HeartIcon className="w-4 h-4" /> }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🩺 {t('patients.my_patients')}</h1>
          <span className="text-sm text-gray-500">{t('patients.patient_count', { count: patients.length })}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(p => (
            <div key={p.id} className="card cursor-pointer hover:shadow-lg transition-all" onClick={() => handleViewPatient(p)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{p.username}</h3>
                  <p className="text-sm text-gray-500">{p.email}</p>
                  <p className="text-xs text-gray-400">{t('patientsPage.record_count', { count: p.records_count || 0 })}</p>
                </div>
                <EyeIcon className="w-5 h-5 text-primary-500" />
              </div>
            </div>
          ))}
        </div>

        {patients.length === 0 && (
          <div className="card text-center py-12">
            <UserCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{t('patients.empty_state')}</p>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('patients.details_title', { name: selectedPatient?.username || '' })} size="lg">
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">{t('auth.email')}</p>
                  <p className="font-medium text-sm">{selectedPatient.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('patients.record_count')}</p>
                  <p className="font-medium text-sm">{patientRecords.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('patients.chronic_diseases')}</p>
                  <p className="font-medium text-sm">{patientChronic.length}</p>
                </div>
              </div>

              <div className="flex gap-2 border-b pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailsTab(tab.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeDetailsTab === tab.id
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeDetailsTab === 'records' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-green-600">📋 {t('patients.records_tab')}</h3>
                  </div>
                  {patientRecords.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('patients.no_records')}</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {patientRecords.map(r => (
                        <div key={r.id} className="border dark:border-gray-700 rounded-lg p-3">
                          <p className="font-medium text-green-700 dark:text-green-400">{t('patients.diagnosis_label')}: {r.diagnosis}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('patients.complaint_label')}: {r.chief_complaint}</p>
                          {r.treatment_plan && <p className="text-sm text-gray-500 mt-1">{t('patients.treatment_plan_label')}: {r.treatment_plan}</p>}
                          <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeDetailsTab === 'chronic' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-red-600">❤️ {t('patients.chronic_tab')}</h3>
                    <button
                      onClick={() => setShowChronicForm(!showChronicForm)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      <PlusIcon className="w-3 h-3 inline ml-1" /> {t('common.add')}
                    </button>
                  </div>

                  {showChronicForm && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg mb-3 space-y-2">
                      <input
                        type="text"
                        placeholder={t('patients.disease_name_placeholder')}
                        className="input w-full text-sm"
                        value={newChronicDisease.disease_name}
                        onChange={(e) => setNewChronicDisease({...newChronicDisease, disease_name: e.target.value})}
                      />
                      <input
                        type="date"
                        className="input w-full text-sm"
                        value={newChronicDisease.diagnosed_date.split('T')[0]}
                        onChange={(e) => setNewChronicDisease({...newChronicDisease, diagnosed_date: e.target.value})}
                      />
                      <textarea
                        placeholder={t('patients.notes_placeholder')}
                        className="input w-full text-sm"
                        rows="2"
                        value={newChronicDisease.notes}
                        onChange={(e) => setNewChronicDisease({...newChronicDisease, notes: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddChronicDisease} className="btn-primary text-sm py-1 px-3">{t('common.save')}</button>
                        <button onClick={() => setShowChronicForm(false)} className="btn-secondary text-sm py-1 px-3">{t('common.cancel')}</button>
                      </div>
                    </div>
                  )}

                  {patientChronic.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('patients.no_chronic_diseases')}</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {patientChronic.map(c => (
                        <div key={c.id} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-700 dark:text-red-400">{c.disease_name}</p>
                            <p className="text-xs text-gray-500 mt-1">{t('patients.diagnosed_on')}: {new Date(c.diagnosed_date).toLocaleDateString('ar-EG')}</p>
                            {c.notes && <p className="text-xs text-gray-600 mt-1">{c.notes}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteChronicDisease(c.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                            title={t('common.delete')}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default PatientsPage;