import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DoctorsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ username: '', email: '', password: '', specialty: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users');
      const doctorsList = res.data.filter(u => u.role === 'doctor');
      setDoctors(doctorsList);
    } catch (error) {
      toast.error(t('doctorsPage.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm(t('doctorsPage.delete_confirm'))) return;
    try {
      await api.delete(`/admin/users/${doctorId}`);
      toast.success(t('doctorsPage.delete_success'));
      fetchDoctors();
    } catch (error) {
      toast.error(t('doctorsPage.delete_error'));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', { ...newDoctor, role: 'doctor' });
      toast.success(t('doctorsPage.add_success'));
      setShowAddModal(false);
      setNewDoctor({ username: '', email: '', password: '', specialty: '' });
      fetchDoctors();
    } catch (error) {
      toast.error(t('doctorsPage.add_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  if (isLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('doctorsPage.title')}</h1>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t('doctorsPage.add_doctor')}</button>
        </div>

        <div className="card overflow-x-auto">
          <table className="min-w-full">
            <thead><tr className="border-b bg-gray-50"><th className="py-3 px-4 text-right">{t('doctorsPage.th_id')}</th><th>{t('patients.name')}</th><th>{t('auth.email')}</th><th>{t('doctors.specialty')}</th><th>{t('common.status')}</th><th>{t('doctorsPage.th_reg_date')}</th><th></th></tr></thead>
            <tbody>
              {doctors.map((d, idx) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{idx+1}</td>
                  <td className="font-medium">{d.username}</td>
                  <td>{d.email}</td>
                  <td>{d.specialty || '-'}</td>
                  <td>{d.is_verified ? <span className="text-green-600">{t('patients.verified')}</span> : <span className="text-yellow-600">{t('patients.unverified')}</span>}</td>
                  <td className="text-sm">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td><button onClick={() => handleDelete(d.id)} className="text-red-500"><TrashIcon className="w-5 h-5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-100 rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">{t('doctorsPage.add_modal_title')}</h3><button onClick={() => setShowAddModal(false)}><XMarkIcon className="w-6 h-6" /></button></div>
              <form onSubmit={handleAdd} className="space-y-4">
                <input type="text" placeholder={t('profile.username')} className="input" value={newDoctor.username} onChange={(e) => setNewDoctor({...newDoctor, username: e.target.value})} required />
                <input type="email" placeholder={t('auth.email')} className="input" value={newDoctor.email} onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})} required />
                <input type="password" placeholder={t('auth.password')} className="input" value={newDoctor.password} onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})} required />
                <input type="text" placeholder={t('doctorsPage.specialty_placeholder')} className="input" value={newDoctor.specialty} onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})} />
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">{isSubmitting ? t('doctorsPage.submitting') : t('common.add')}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorsPage;
