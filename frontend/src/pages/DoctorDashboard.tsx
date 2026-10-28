import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Users, CheckCircle, Clock, Play, Check, XCircle, FileText, Activity } from 'lucide-react';
import { getSocket } from '../lib/socket';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueState, setQueueState] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [consultModalAppt, setConsultModalAppt] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [prescription, setPrescription] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  useEffect(() => {
    const socket = getSocket();
    if (user?.doctorProfileId) {
      socket.emit('join:doctor', user.doctorProfileId);
    }

    socket.on('queue:updated', () => {
      fetchDashboardData();
    });
    socket.on('queue:doctorUpdate', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('queue:updated');
      socket.off('queue:doctorUpdate');
    };
  }, [user, selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const apptRes = await api.get(`/appointments?date=${selectedDate}`);
      if (apptRes.data.success) {
        setAppointments(apptRes.data.data);
      }

      // Fetch doctor queue
      if (user?.doctorProfileId) {
        const queueRes = await api.get(`/queue/doctor/${user.doctorProfileId}?date=${selectedDate}`);
        if (queueRes.data.success) {
          setQueueState(queueRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/queue/call-next');
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusTransition = async (apptId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'completed') {
        payload.doctorNotes = notes;
        payload.prescription = prescription;
      }
      const res = await api.put(`/appointments/${apptId}/status`, payload);
      if (res.data.success) {
        setConsultModalAppt(null);
        setNotes('');
        setPrescription('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const todayCount = appointments.length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const waitingCount = appointments.filter((a) => ['booked', 'confirmed'].includes(a.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Stethoscope className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-teal-700">
              OPD Consultation Console
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Doctor Workstation — {user?.name}
          </h1>
          <p className="text-sm text-slate-600">
            Manage your daily outpatient schedule, call tokens, and record medical consultations.
          </p>
        </div>

        {/* Date Selector */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-xs"
          />
          <button
            onClick={handleCallNext}
            disabled={actionLoading}
            className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" /> Call Next Patient
          </button>
        </div>
      </div>

      {/* OPD Queue Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Now Serving Token</span>
          <div className="text-3xl font-extrabold text-teal-700 mt-1">
            {queueState?.currentServingToken ? `#${queueState.currentServingToken}` : 'Idle'}
          </div>
          <span className="text-[11px] text-slate-500">Currently in consultation desk</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Waiting in Queue</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            {waitingCount}
          </div>
          <span className="text-[11px] text-slate-500">Patients in lobby</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Completed Consults</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {completedCount}
          </div>
          <span className="text-[11px] text-slate-500">Total finished today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Scheduled</span>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">
            {todayCount}
          </div>
          <span className="text-[11px] text-slate-500">Appointments for {selectedDate}</span>
        </div>
      </div>

      {/* Appointments & Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Patient Queue Schedule ({selectedDate})
          </h3>
          <span className="text-xs text-slate-500">Sorted by Authoritative Server Token</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No appointments booked for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Token</th>
                  <th className="px-6 py-3">Patient Details</th>
                  <th className="px-6 py-3">Slot Time</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr
                    key={appt._id}
                    className={`hover:bg-slate-50 transition ${
                      appt.status === 'in_consultation' ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-sky-700">
                      #{appt.tokenNumber}
                      <span className="block text-[10px] text-slate-400">{appt.tokenCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{appt.patientId?.name}</span>
                      <span className="block text-[10px] text-slate-500">
                        {appt.patientId?.phone || 'No phone'} • {appt.patientId?.patientProfile?.gender || ''} (Age: {appt.patientId?.patientProfile?.age || 'N/A'})
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{appt.timeSlot}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{appt.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          appt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'in_consultation'
                            ? 'bg-teal-100 text-teal-800 animate-pulse'
                            : appt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {appt.status === 'booked' && (
                        <button
                          onClick={() => handleStatusTransition(appt._id, 'in_consultation')}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Start Consult
                        </button>
                      )}

                      {appt.status === 'in_consultation' && (
                        <button
                          onClick={() => {
                            setConsultModalAppt(appt);
                            setNotes(appt.doctorNotes || '');
                            setPrescription(appt.prescription || '');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Finish & Prescribe
                        </button>
                      )}

                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusTransition(appt._id, 'no_show')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium text-[11px]"
                        >
                          No Show
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Consultation Modal */}
      {consultModalAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Complete Consultation — Token #{consultModalAppt.tokenNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {consultModalAppt.patientId?.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Doctor Notes & Diagnostic Assessment
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical observation, vitals, diagnosis..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Prescription & Advice
                </label>
                <textarea
                  rows={3}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Medication dosage, follow-up date, tests..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConsultModalAppt(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusTransition(consultModalAppt._id, 'completed')}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Sign & Complete Consultation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
