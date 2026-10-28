import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Appointment } from '../types';
import { Calendar, Clock, Building2, Stethoscope, AlertCircle, FileText, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelModalId) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/appointments/${cancelModalId}/cancel`, {
        reason: cancelReason,
      });
      if (res.data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === cancelModalId ? { ...a, status: 'cancelled' } : a))
        );
        setCancelModalId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Appointments & Tokens
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View booking status, hospital directions, medical tokens, and print receipts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/doctors"
            className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            + Book New Appointment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Appointments Scheduled</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            You do not have any active or past appointments recorded.
          </p>
          <Link
            to="/doctors"
            className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold inline-block"
          >
            Find a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isCancellable = ['booked', 'confirmed'].includes(appt.status);
            return (
              <div
                key={appt._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Token Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-sky-600">Token</span>
                    <span className="text-xl font-extrabold text-sky-700 leading-none">
                      #{appt.tokenNumber}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {appt.tokenCode}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          appt.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : appt.status === 'in_consultation'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse'
                            : appt.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {appt.doctorId?.userId?.name || 'Doctor'}
                    </h3>
                    <p className="text-xs text-sky-600 font-medium">
                      {appt.doctorId?.specialization} • {appt.departmentId?.name}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{appt.hospitalId?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{appt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{appt.timeSlot}</span>
                      </div>
                    </div>

                    {appt.doctorNotes && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                        <strong>Doctor Notes:</strong> {appt.doctorNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Link
                    to={`/patient/queue`}
                    className="py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition"
                  >
                    Track Live Queue
                  </Link>

                  {isCancellable && (
                    <button
                      onClick={() => setCancelModalId(appt._id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel this booking? This will immediately release your reserved slot and token number.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelModalId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Keep Booking
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCancelAppointment}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
