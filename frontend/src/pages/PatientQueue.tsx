import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Appointment } from '../types';
import { Activity, Clock, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { getSocket } from '../lib/socket';

export const PatientQueue: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>('');
  const [queueData, setQueueData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveAppointments();
  }, []);

  useEffect(() => {
    if (selectedApptId) {
      fetchQueueStatus(selectedApptId);
    }
  }, [selectedApptId]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('queue:updated', () => {
      if (selectedApptId) fetchQueueStatus(selectedApptId);
    });
    socket.on('queue:doctorUpdate', () => {
      if (selectedApptId) fetchQueueStatus(selectedApptId);
    });

    return () => {
      socket.off('queue:updated');
      socket.off('queue:doctorUpdate');
    };
  }, [selectedApptId]);

  const fetchActiveAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        const active = res.data.data.filter((a: Appointment) =>
          ['booked', 'confirmed', 'in_consultation'].includes(a.status)
        );
        setAppointments(active);
        if (active.length > 0) {
          setSelectedApptId(active[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async (apptId: string) => {
    setRefreshing(true);
    try {
      const res = await api.get(`/queue/patient/${apptId}`);
      if (res.data.success) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedAppointment = appointments.find((a) => a._id === selectedApptId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Patient Queue & Waiting Status
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time server-synced OPD waiting position and estimated consultation call time.
          </p>
        </div>

        {selectedApptId && (
          <button
            onClick={() => fetchQueueStatus(selectedApptId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-pulse h-64"></div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Active OPD Queues</h3>
          <p className="text-sm text-slate-500 mt-1">
            You currently do not have any active appointments in queue for today.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Appointment Selector if multiple */}
          {appointments.length > 1 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Select Active Appointment
              </label>
              <select
                value={selectedApptId}
                onChange={(e) => setSelectedApptId(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-xs"
              >
                {appointments.map((a) => (
                  <option key={a._id} value={a._id}>
                    Token #{a.tokenNumber} — {a.doctorId?.userId?.name} ({a.date} @ {a.timeSlot})
                  </option>
                ))}
              </select>
            </div>
          )}

          {queueData && selectedAppointment && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
              {/* Doctor and Hospital Header Banner */}
              <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-6 text-white">
                <span className="text-xs uppercase tracking-widest font-semibold text-sky-100">
                  {selectedAppointment.hospitalId?.name}
                </span>
                <h2 className="text-2xl font-bold mt-1">
                  {selectedAppointment.doctorId?.userId?.name}
                </h2>
                <p className="text-xs text-sky-100 font-medium">
                  {selectedAppointment.departmentId?.name} • Room {selectedAppointment.doctorId?.roomNumber}
                </p>
              </div>

              {/* Real-time Queue Counters */}
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-b border-slate-100">
                {/* Your Token */}
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                    Your Token
                  </span>
                  <span className="text-4xl font-black text-sky-700 mt-1">
                    #{queueData.tokenNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {selectedAppointment.tokenCode}
                  </span>
                </div>

                {/* Now Serving */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Now Serving
                  </span>
                  <span className="text-4xl font-black text-amber-800 mt-1">
                    {queueData.currentServingToken ? `#${queueData.currentServingToken}` : 'None'}
                  </span>
                  <span className="text-[10px] text-amber-700 mt-1">
                    {queueData.currentServingToken === queueData.tokenNumber
                      ? '⚡ YOUR TURN NOW!'
                      : 'Consulting Inside'}
                  </span>
                </div>

                {/* Estimated Waiting Time */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Estimated Wait
                  </span>
                  <span className="text-4xl font-black text-emerald-800 mt-1">
                    ~{queueData.estimatedWaitMinutes} <span className="text-sm font-semibold">min</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 mt-1">
                    {queueData.patientsAhead} patient(s) ahead of you
                  </span>
                </div>
              </div>

              {/* Explainable AI Estimation Card */}
              <div className="p-6 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Explainable Waiting-Time Estimation Model
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Formula: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-sky-700">{queueData.calculationDetails?.formula}</code>.
                  Calculated based on {queueData.patientsAhead} patient(s) ahead with a clinic historical average of {queueData.calculationDetails?.averageConsultMinutes} minutes per consultation.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{queueData.calculationDetails?.note}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
