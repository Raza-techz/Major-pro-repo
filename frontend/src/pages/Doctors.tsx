import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Doctor, Hospital, Department } from '../types';
import { Stethoscope, Building2, MapPin, Calendar, Clock, DollarSign, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Doctors: React.FC = () => {
  const [searchParams] = useSearchParams();
  const hospitalFilter = searchParams.get('hospitalId') || '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>(hospitalFilter);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Booking Modal State
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingReason, setBookingReason] = useState<string>('General Consultation');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedHospital, selectedDepartment, searchTerm]);

  const fetchInitialData = async () => {
    try {
      const [hospRes, deptRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/departments'),
      ]);
      if (hospRes.data.success) setHospitals(hospRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedHospital) params.append('hospitalId', selectedHospital);
      if (selectedDepartment) params.append('departmentId', selectedDepartment);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/doctors?${params.toString()}`);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = async (doctor: Doctor) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedDoctor(doctor);
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedSlot('');
    fetchSlots(doctor._id, bookingDate);
  };

  const fetchSlots = async (doctorId: string, date: string) => {
    try {
      const res = await api.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
      if (res.data.success) {
        setAvailableSlots(res.data.data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = (newDate: string) => {
    setBookingDate(newDate);
    if (selectedDoctor) {
      fetchSlots(selectedDoctor._id, newDate);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setBookingError('Please select a valid time slot');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        date: bookingDate,
        timeSlot: selectedSlot,
        reason: bookingReason,
      });

      if (res.data.success) {
        setBookingSuccess(res.data.data);
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Doctor Directory & OPD Booking
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Find verified specialists, check live consultation fees, and reserve verified queue tokens.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by doctor name or specialization..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Hospital Filter */}
        <div>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} ({h.address.city})
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-64"></div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Doctors Available</h3>
          <p className="text-sm text-slate-500 mt-1">Try modifying your filter options</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {doctor.userId?.name || 'Dr. Specialist'}
                      </h3>
                      <p className="text-xs text-sky-600 font-semibold mt-0.5">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">
                      {doctor.hospitalId?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {doctor.departmentId?.name} • Room: {doctor.roomNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Shift: {doctor.shiftStart} - {doctor.shiftEnd} (~{doctor.averageConsultMinutes}m/consult)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      ₹{doctor.consultationFee} Consultation Fee
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                <button
                  onClick={() => handleOpenBooking(doctor)}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Book Appointment & Get Token
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {!bookingSuccess ? (
              <>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Book Appointment
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedDoctor.userId?.name} ({selectedDoctor.specialization})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                    {bookingError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  {/* Slot Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                      Available Time Slots
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.length === 0 ? (
                        <div className="col-span-3 text-xs text-slate-400 text-center py-4">
                          Loading slot availability...
                        </div>
                      ) : (
                        availableSlots.map((item) => (
                          <button
                            key={item.slot}
                            type="button"
                            disabled={!item.isAvailable}
                            onClick={() => setSelectedSlot(item.slot)}
                            className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                              !item.isAvailable
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : selectedSlot === item.slot
                                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-sky-500'
                            }`}
                          >
                            {item.slot}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Reason for Consultation
                    </label>
                    <textarea
                      rows={2}
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      placeholder="Describe symptoms or routine checkup..."
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                    <strong>Note:</strong> Token number is server-authoritative and assigned immediately upon submission.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={bookingLoading || !selectedSlot}
                      onClick={handleConfirmBooking}
                      className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition shadow-sm"
                    >
                      {bookingLoading ? 'Reserving...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success / Receipt Screen */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your token has been registered in the live hospital queue system.
                </p>

                <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Token Number:</span>
                    <span className="font-extrabold text-lg text-sky-600">
                      #{bookingSuccess.appointment.tokenNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Token ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {bookingSuccess.appointment.tokenCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Slot:</span>
                    <span className="font-semibold text-slate-800">
                      {bookingSuccess.appointment.date} @ {bookingSuccess.appointment.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Wait:</span>
                    <span className="font-semibold text-slate-800">
                      ~{bookingSuccess.queueEntry.estimatedWaitMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      navigate('/patient/appointments');
                    }}
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
                  >
                    View in Appointments
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      navigate('/patient/queue');
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Track Live Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
