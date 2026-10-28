export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin' | 'super_admin';
  phone?: string;
  hospitalId?: string | null;
  doctorProfileId?: string | null;
  patientProfile?: {
    gender?: string;
    age?: number;
    bloodGroup?: string;
    emergencyContact?: string;
    address?: string;
  };
}

export interface Hospital {
  _id: string;
  name: string;
  code: string;
  address: {
    street?: string;
    city: string;
    state: string;
    pincode?: string;
  };
  phone: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  totalBeds: number;
  operatingHours: string;
  createdAt: string;
}

export interface Department {
  _id: string;
  hospitalId: string | { _id: string; name: string; code: string };
  name: string;
  description: string;
  locationFloor: string;
  status: 'active' | 'inactive';
}

export interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  hospitalId: Hospital;
  departmentId: Department;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string;
  averageConsultMinutes: number;
  workingDays: string[];
  shiftStart: string;
  shiftEnd: string;
  isAvailable: boolean;
  status: 'pending_approval' | 'active' | 'inactive';
}

export interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    patientProfile?: any;
  };
  doctorId: Doctor;
  hospitalId: Hospital;
  departmentId: Department;
  date: string;
  timeSlot: string;
  tokenNumber: number;
  tokenCode: string;
  reason: string;
  status: 'booked' | 'confirmed' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
  cancellationReason?: string;
  doctorNotes?: string;
  prescription?: string;
  createdAt: string;
}

export interface QueueEntry {
  _id: string;
  hospitalId: string;
  doctorId: string;
  appointmentId: any;
  patientId: any;
  date: string;
  tokenNumber: number;
  status: 'waiting' | 'serving' | 'completed' | 'skipped' | 'cancelled';
  estimatedWaitMinutes: number;
  calledAt?: string;
  servedAt?: string;
}

export interface Bed {
  _id: string;
  hospitalId: string | { _id: string; name: string };
  wardId: {
    _id: string;
    name: string;
    type: string;
    floor: string;
  };
  bedNumber: string;
  type: 'standard' | 'icu' | 'ventilator' | 'pediatric';
  status: 'available' | 'occupied' | 'reserved' | 'under_cleaning' | 'out_of_service';
  currentAdmission?: {
    patientName?: string;
    patientContact?: string;
    admittedAt?: string;
    expectedDischargeAt?: string;
    notes?: string;
  };
  lastStatusChange?: string;
}

export interface Ward {
  _id: string;
  hospitalId: string;
  name: string;
  type: string;
  floor: string;
  totalBeds: number;
}

export interface Equipment {
  _id: string;
  equipmentId: string;
  name: string;
  hospitalId: string | { _id: string; name: string; code: string };
  departmentId?: { _id: string; name: string };
  category: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  status: 'available' | 'in_use' | 'under_maintenance' | 'out_of_service';
  location: string;
  usageCharge: number;
  billingUnit: string;
  notes?: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'queue' | 'cancellation' | 'alert' | 'system';
  read: boolean;
  createdAt: string;
  data?: any;
}
