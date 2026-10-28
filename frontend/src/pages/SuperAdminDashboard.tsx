import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Hospital } from '../types';
import { ShieldAlert, Building2, Users, Bed, Plus, CheckCircle, Activity, Globe } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [platformStats, setPlatformStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // New Hospital Modal
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospCode, setHospCode] = useState('');
  const [hospCity, setHospCity] = useState('');
  const [hospState, setHospState] = useState('');
  const [hospPhone, setHospPhone] = useState('');
  const [hospEmail, setHospEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      const [hospRes, statRes] = await Promise.all([
        api.get('/hospitals?status=all'),
        api.get('/analytics/platform'),
      ]);

      if (hospRes.data.success) setHospitals(hospRes.data.data);
      if (statRes.data.success) setPlatformStats(statRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await api.post('/hospitals', {
        name: hospName,
        code: hospCode,
        address: { city: hospCity, state: hospState },
        phone: hospPhone,
        email: hospEmail,
        status: 'active',
      });

      if (res.data.success) {
        setShowAddHospitalModal(false);
        setHospName('');
        setHospCode('');
        setHospCity('');
        setHospState('');
        setHospPhone('');
        setHospEmail('');
        fetchPlatformData();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to onboard hospital');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (hospitalId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.put(`/hospitals/${hospitalId}`, { status: nextStatus });
      if (res.data.success) {
        fetchPlatformData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update hospital status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-800">
              Platform Governance Console
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Super Administrator Portal
          </h1>
          <p className="text-sm text-slate-600">
            Multi-hospital network supervision, hospital registration, system telemetry, and audit management.
          </p>
        </div>

        <button
          onClick={() => setShowAddHospitalModal(true)}
          className="mt-4 md:mt-0 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-700/20"
        >
          <Plus className="w-4 h-4" /> Onboard New Hospital
        </button>
      </div>

      {/* Platform Analytics Cards */}
      {platformStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Hospitals</span>
            <div className="text-3xl font-extrabold text-purple-700 mt-1">
              {platformStats.hospitals?.total}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {platformStats.hospitals?.active} active tenants
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Doctors Enrolled</span>
            <div className="text-3xl font-extrabold text-sky-600 mt-1">
              {platformStats.users?.totalDoctors}
            </div>
            <span className="text-[11px] text-slate-500">Across all institutions</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Appointments</span>
            <div className="text-3xl font-extrabold text-teal-600 mt-1">
              {platformStats.appointments?.total}
            </div>
            <span className="text-[11px] text-slate-500">
              {platformStats.appointments?.today} booked today
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Hospital Beds</span>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">
              {platformStats.beds?.total}
            </div>
            <span className="text-[11px] text-slate-500">
              {platformStats.beds?.available} currently available
            </span>
          </div>
        </div>
      )}

      {/* Hospital Tenants Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Hospital Tenants Directory
            </h3>
            <p className="text-xs text-slate-500">
              Enable, suspend, or configure hospital institutions across the MIDFLOW AI network.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Hospital Details</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Total Beds</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((hosp) => (
                <tr key={hosp._id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 block">{hosp.name}</span>
                    <span className="text-[10px] text-slate-400">{hosp.email} • {hosp.phone}</span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-purple-700">{hosp.code}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {hosp.address.city}, {hosp.address.state}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{hosp.totalBeds} Beds</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        hosp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {hosp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(hosp._id, hosp.status)}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                        hosp.status === 'active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {hosp.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Hospital Modal */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Onboard New Hospital</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register an accredited hospital institution onto the platform network.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterHospital} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. Apollo Super Speciality"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Hospital Code</label>
                <input
                  type="text"
                  required
                  value={hospCode}
                  onChange={(e) => setHospCode(e.target.value)}
                  placeholder="e.g. APSSH"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={hospCity}
                    onChange={(e) => setHospCity(e.target.value)}
                    placeholder="Bangalore"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={hospState}
                    onChange={(e) => setHospState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={hospPhone}
                  onChange={(e) => setHospPhone(e.target.value)}
                  placeholder="+91-80-1234-5678"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={hospEmail}
                  onChange={(e) => setHospEmail(e.target.value)}
                  placeholder="admin@apollossh.org"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHospitalModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-700 rounded-xl hover:bg-purple-800 disabled:opacity-50"
                >
                  {modalLoading ? 'Registering...' : 'Register Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
