import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Bed, Ward, Doctor, Department, Equipment, Hospital } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Bed as BedIcon,
  Stethoscope,
  Users,
  Activity,
  Plus,
  RefreshCw,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'beds' | 'doctors' | 'equipment' | 'optimization'>('overview');

  // Data states
  const [hospitalInfo, setHospitalInfo] = useState<Hospital | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [optimization, setOptimization] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New Equipment Modal State
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('Radiology');
  const [eqLocation, setEqLocation] = useState('Diagnostic Wing');
  const [eqCharge, setEqCharge] = useState('1500');
  const [eqBillingUnit, setEqBillingUnit] = useState('per scan');
  const [eqDeptId, setEqDeptId] = useState('');

  // Bed Admission & Discharge Modals
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [admissionPatientName, setAdmissionPatientName] = useState('');
  const [admissionContact, setAdmissionContact] = useState('');
  const [admissionHours, setAdmissionHours] = useState('24');
  const [modalActionLoading, setModalActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New Doctor Provisioning Modal
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
  const [newDoctorDeptId, setNewDoctorDeptId] = useState('');
  const [newDoctorFee, setNewDoctorFee] = useState('500');

  useEffect(() => {
    fetchHospitalData();
  }, [user]);

  const fetchHospitalData = async () => {
    setLoading(true);
    try {
      const [bedsRes, wardsRes, docRes, deptRes, optRes, eqRes] = await Promise.all([
        api.get('/beds'),
        api.get('/beds/wards'),
        api.get('/doctors'),
        api.get('/departments'),
        api.get('/analytics/hospital-optimization'),
        api.get('/equipment'),
      ]);

      if (bedsRes.data.success) setBeds(bedsRes.data.data);
      if (wardsRes.data.success) setWards(wardsRes.data.data);
      if (docRes.data.success) setDoctors(docRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (optRes.data.success) setOptimization(optRes.data.data);
      if (eqRes.data.success) setEquipmentList(eqRes.data.data);

      if (user?.hospitalId) {
        const hospRes = await api.get(`/hospitals/${user.hospitalId}`);
        if (hospRes.data.success) {
          setHospitalInfo(hospRes.data.data.hospital || hospRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalActionLoading(true);
    try {
      const res = await api.post('/equipment', {
        name: eqName,
        category: eqCategory,
        location: eqLocation,
        usageCharge: Number(eqCharge) || 0,
        billingUnit: eqBillingUnit,
        departmentId: eqDeptId || (departments[0] ? departments[0]._id : null),
        status: 'available',
      });
      if (res.data.success) {
        setShowAddEquipmentModal(false);
        setEqName('');
        fetchHospitalData();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to add equipment');
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleToggleEquipmentStatus = async (eqId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'in_use' : currentStatus === 'in_use' ? 'under_maintenance' : 'available';
    try {
      await api.put(`/equipment/${eqId}`, { status: nextStatus });
      fetchHospitalData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update equipment');
    }
  };

  // Admit patient workflow
  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    setModalActionLoading(true);
    setModalError(null);

    const expectedDate = new Date(Date.now() + Number(admissionHours) * 3600 * 1000);

    try {
      const res = await api.post(`/beds/${selectedBed._id}/admit`, {
        patientName: admissionPatientName,
        patientContact: admissionContact,
        expectedDischargeAt: expectedDate,
      });

      if (res.data.success) {
        setSelectedBed(null);
        setAdmissionPatientName('');
        setAdmissionContact('');
        fetchHospitalData();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to admit patient to bed');
    } finally {
      setModalActionLoading(false);
    }
  };

  // Discharge patient workflow (transitions to 'under_cleaning' for sanitation)
  const handleDischarge = async (bedId: string) => {
    try {
      const res = await api.post(`/beds/${bedId}/discharge`);
      if (res.data.success) {
        fetchHospitalData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Discharge failed');
    }
  };

  // Housekeeping completes cleaning and marks bed 'available'
  const handleCompleteCleaning = async (bedId: string) => {
    try {
      const res = await api.put(`/beds/${bedId}/status`, { status: 'available' });
      if (res.data.success) {
        fetchHospitalData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status change failed');
    }
  };

  // Provision new doctor
  const handleProvisionDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalActionLoading(true);
    setModalError(null);

    try {
      const res = await api.post('/doctors', {
        name: newDoctorName,
        email: newDoctorEmail,
        specialization: newDoctorSpecialization,
        departmentId: newDoctorDeptId || departments[0]?._id,
        hospitalId: user?.hospitalId,
        consultationFee: Number(newDoctorFee) || 500,
      });

      if (res.data.success) {
        setShowAddDoctorModal(false);
        setNewDoctorName('');
        setNewDoctorEmail('');
        setNewDoctorSpecialization('');
        fetchHospitalData();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to provision doctor account');
    } finally {
      setModalActionLoading(false);
    }
  };

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const availableBeds = beds.filter((b) => b.status === 'available').length;
  const cleaningBeds = beds.filter((b) => b.status === 'under_cleaning').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner with Assigned Hospital Card */}
      {hospitalInfo && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-extrabold text-lg">
              {hospitalInfo.code?.slice(0, 3) || 'HSP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{hospitalInfo.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/30 text-teal-300 border border-teal-400/30">
                  {hospitalInfo.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {hospitalInfo.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-1">
                <span>📍 {hospitalInfo.address?.city}, {hospitalInfo.address?.state}</span>
                <span>📞 {hospitalInfo.phone}</span>
                <span>👤 Logged in as: <strong>{user?.name}</strong> ({user?.role?.replace('_', ' ')})</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-teal-700">
              Hospital Operations Console
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Operations & Resource Management
          </h1>
          <p className="text-sm text-slate-600">
            Tenant-isolated clinical controls: bed wards, admissions, housekeeping, and medical equipment.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="mt-4 md:mt-0 flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('beds')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'beds' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Bed Management
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Doctors & OPD
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'equipment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Equipment Inventory ({equipmentList.length})
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'optimization' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" /> AI Optimization
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Available Beds</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{availableBeds}</div>
          <span className="text-[11px] text-slate-500">Ready for admission</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Occupied Beds</span>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">{occupiedBeds}</div>
          <span className="text-[11px] text-slate-500">Inpatient admissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Under Cleaning</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{cleaningBeds}</div>
          <span className="text-[11px] text-slate-500">Sanitation required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Doctors</span>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">{doctors.length}</div>
          <span className="text-[11px] text-slate-500">{departments.length} clinical depts</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Decision Recommendations summary banner */}
          {optimization?.recommendations && (
            <div className="bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-200/80 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-sm text-teal-900">
                  Hospital AI Decision Support & Capacity Alert
                </h3>
              </div>
              <div className="space-y-3">
                {optimization.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="bg-white/80 p-3.5 rounded-2xl border border-teal-100 flex items-start gap-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] shrink-0 ${
                        rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{rec.insight}</span>
                      <p className="text-slate-600 mt-0.5">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Doctor Workload Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              Today's OPD Consultation Loads
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{d.userId?.name}</h4>
                    <span className="text-[11px] text-sky-600 font-medium">{d.specialization}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Room</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{d.roomNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BED MANAGEMENT */}
      {activeTab === 'beds' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Hospital Inpatient Bed Inventory & Admission State
              </h3>
              <p className="text-xs text-slate-500">
                Strict sanitation workflow: Occupied ➔ Discharged ➔ Under Cleaning ➔ Available
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Bed ID</th>
                  <th className="px-6 py-3">Ward & Floor</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Current Patient</th>
                  <th className="px-6 py-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map((bed) => (
                  <tr key={bed._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{bed.bedNumber}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{bed.wardId?.name}</span>
                      <span className="block text-[10px] text-slate-400">{bed.wardId?.floor}</span>
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold text-slate-600">{bed.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          bed.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bed.status === 'occupied'
                            ? 'bg-rose-100 text-rose-800'
                            : bed.status === 'under_cleaning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {bed.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bed.currentAdmission?.patientName ? (
                        <div>
                          <span className="font-bold text-slate-800">
                            {bed.currentAdmission.patientName}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {bed.currentAdmission.patientContact}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {bed.status === 'available' && (
                        <button
                          onClick={() => setSelectedBed(bed)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Admit Patient
                        </button>
                      )}

                      {bed.status === 'occupied' && (
                        <button
                          onClick={() => handleDischarge(bed._id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Discharge
                        </button>
                      )}

                      {bed.status === 'under_cleaning' && (
                        <button
                          onClick={() => handleCompleteCleaning(bed._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Mark Sanitized
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

      {/* TAB 3: DOCTOR MANAGEMENT */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Registered Hospital Doctors & Staff
              </h3>
              <p className="text-xs text-slate-500">
                Provision authenticated accounts and link specialists to clinical departments.
              </p>
            </div>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Provision New Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div key={doc._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.userId?.name}</h4>
                    <span className="text-xs text-sky-600 font-semibold">{doc.specialization}</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>Department: {doc.departmentId?.name}</p>
                  <p>Shift: {doc.shiftStart} - {doc.shiftEnd}</p>
                  <p>Fee: ₹{doc.consultationFee}</p>
                  <p>Room: {doc.roomNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MEDICAL EQUIPMENT INVENTORY */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Medical Equipment & Diagnostic Machine Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Configurable operational availability, maintenance tracking, and estimated demonstration scan charges.
              </p>
            </div>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Medical Equipment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Equipment Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Usage Charge (Demo)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No medical equipment records found. Click 'Add Medical Equipment' to register a machine.
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((eq) => (
                    <tr key={eq._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {eq.name}
                        <span className="block text-[10px] font-mono text-slate-400">{eq.equipmentId}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{eq.category}</td>
                      <td className="px-6 py-4 text-slate-600">{eq.location}</td>
                      <td className="px-6 py-4 font-mono font-bold text-teal-700">
                        ₹{eq.usageCharge} <span className="text-[10px] font-normal text-slate-400">/ {eq.billingUnit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                            eq.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : eq.status === 'in_use'
                              ? 'bg-blue-100 text-blue-800'
                              : eq.status === 'under_maintenance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {eq.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleEquipmentStatus(eq._id, eq.status)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AI OPTIMIZATION & RESOURCE ANALYTICS */}
      {activeTab === 'optimization' && optimization && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Explainable Operational Analytics & Resource Advisory
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transparent capacity indicators and clinical queue load distributions.
            </p>
          </div>

          {/* Occupancy Indicator */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-700">
              <span>Overall Bed Occupancy Threshold</span>
              <span>{optimization.bedMetrics?.occupancyRatePercent}% Capacity</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  optimization.bedMetrics?.occupancyRatePercent > 80
                    ? 'bg-rose-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${optimization.bedMetrics?.occupancyRatePercent}%` }}
              ></div>
            </div>
          </div>

          {/* Recommendations Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
              System Insights & Recommended Action Rules
            </h4>
            {optimization.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {rec.priority}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">{rec.category}</span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  <strong>Finding:</strong> {rec.insight}
                </p>
                <p className="text-xs text-sky-700 mt-0.5 font-medium">
                  <strong>Recommended Action:</strong> {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bed Admission Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Admit Patient to Bed {selectedBed.bedNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ward: {selectedBed.wardId?.name}
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={admissionPatientName}
                  onChange={(e) => setAdmissionPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={admissionContact}
                  onChange={(e) => setAdmissionContact(e.target.value)}
                  placeholder="+91-98765-00000"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Stay Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={admissionHours}
                  onChange={(e) => setAdmissionHours(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalActionLoading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:opacity-50"
                >
                  {modalActionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Provision Doctor Account</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new authenticated physician account to your hospital roster.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleProvisionDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="Dr. Rajesh Kumar"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newDoctorEmail}
                  onChange={(e) => setNewDoctorEmail(e.target.value)}
                  placeholder="doctor.rajesh@midflow.ai"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={newDoctorSpecialization}
                  onChange={(e) => setNewDoctorSpecialization(e.target.value)}
                  placeholder="Consultant Neurologist"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newDoctorDeptId}
                  onChange={(e) => setNewDoctorDeptId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={newDoctorFee}
                  onChange={(e) => setNewDoctorFee(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalActionLoading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50"
                >
                  {modalActionLoading ? 'Saving...' : 'Create Doctor Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Medical Equipment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register medical machine with location and demonstration charges.
            </p>

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment / Machine Name</label>
                <input
                  type="text"
                  required
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  placeholder="e.g. 128-Slice CT Scanner"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value)}
                    className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Critical Care">Critical Care</option>
                    <option value="Surgical">Surgical</option>
                    <option value="General Diagnostic">General Diagnostic</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Floor / Wing</label>
                  <input
                    type="text"
                    required
                    value={eqLocation}
                    onChange={(e) => setEqLocation(e.target.value)}
                    placeholder="Ground Floor, Wing B"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usage Charge (₹)</label>
                  <input
                    type="number"
                    required
                    value={eqCharge}
                    onChange={(e) => setEqCharge(e.target.value)}
                    placeholder="2500"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Unit</label>
                  <select
                    value={eqBillingUnit}
                    onChange={(e) => setEqBillingUnit(e.target.value)}
                    className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="per scan">per scan</option>
                    <option value="per session">per session</option>
                    <option value="per hour">per hour</option>
                    <option value="per day">per day</option>
                    <option value="flat fee">flat fee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={eqDeptId}
                  onChange={(e) => setEqDeptId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalActionLoading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50"
                >
                  {modalActionLoading ? 'Saving...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
