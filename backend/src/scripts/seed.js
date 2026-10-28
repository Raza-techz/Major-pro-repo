const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/midflow_ai';
  console.log(`Connecting to MongoDB at ${mongoURI}...`);
  await mongoose.connect(mongoURI);

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Department.deleteMany({}),
    DoctorProfile.deleteMany({}),
    Appointment.deleteMany({}),
    QueueEntry.deleteMany({}),
    Ward.deleteMany({}),
    Bed.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('Seeding Hospitals...');
  const hospital1 = await Hospital.create({
    name: 'City Apex Multi-Speciality Hospital',
    code: 'CAMSH',
    address: {
      street: '124 Healthcare Boulevard',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    phone: '+91-22-2495-0100',
    email: 'info@cityapex.org',
    status: 'active',
    totalBeds: 120,
    operatingHours: '24x7 Emergency & OPD (09:00 AM - 05:00 PM)',
  });

  const hospital2 = await Hospital.create({
    name: 'Metro Care Super Speciality Hospital',
    code: 'MCSSH',
    address: {
      street: '45 Ring Road Sector 14',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    phone: '+91-11-2384-9000',
    email: 'contact@metrocare.org',
    status: 'active',
    totalBeds: 80,
    operatingHours: '24x7 Emergency & OPD (09:00 AM - 04:00 PM)',
  });

  console.log('Seeding Departments...');
  const deptCardio1 = await Department.create({
    hospitalId: hospital1._id,
    name: 'Cardiology',
    description: 'Comprehensive cardiac care, ECG, Echo, and intervention consultations.',
    locationFloor: '2nd Floor, Wing A',
  });

  const deptOrtho1 = await Department.create({
    hospitalId: hospital1._id,
    name: 'Orthopedics',
    description: 'Joint replacement, trauma care, and bone health consultations.',
    locationFloor: '1st Floor, Wing B',
  });

  const deptNeuro1 = await Department.create({
    hospitalId: hospital1._id,
    name: 'Neurology',
    description: 'Advanced brain, spine, and nervous system diagnostic care.',
    locationFloor: '3rd Floor, Wing C',
  });

  const deptGeneral2 = await Department.create({
    hospitalId: hospital2._id,
    name: 'General Medicine',
    description: 'Primary medical consultations, diagnostics, and preventative health.',
    locationFloor: 'Ground Floor',
  });

  console.log('Seeding Users & Profiles...');
  // 1. Super Admin
  const superAdmin = await User.create({
    name: 'Platform Super Admin',
    email: 'superadmin@midflow.ai',
    password: 'Password@123',
    phone: '+91-98000-00001',
    role: 'super_admin',
  });

  // 2. Hospital Admin 1 (City Apex)
  const hospitalAdmin1 = await User.create({
    name: 'Dr. Ramesh Sharma (Admin)',
    email: 'admin@cityapex.org',
    password: 'Password@123',
    phone: '+91-98000-00002',
    role: 'hospital_admin',
    hospitalId: hospital1._id,
  });

  // 3. Hospital Admin 2 (Metro Care)
  const hospitalAdmin2 = await User.create({
    name: 'Sanjay Verma (Admin)',
    email: 'admin@metrocare.org',
    password: 'Password@123',
    phone: '+91-98000-00003',
    role: 'hospital_admin',
    hospitalId: hospital2._id,
  });

  // 4. Doctor 1 (Cardiologist at City Apex)
  const docUser1 = await User.create({
    name: 'Dr. Ananya Roy',
    email: 'doctor.ananya@midflow.ai',
    password: 'Password@123',
    phone: '+91-98000-00010',
    role: 'doctor',
    hospitalId: hospital1._id,
  });

  const docProfile1 = await DoctorProfile.create({
    userId: docUser1._id,
    hospitalId: hospital1._id,
    departmentId: deptCardio1._id,
    specialization: 'Senior Interventional Cardiologist',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experienceYears: 12,
    consultationFee: 800,
    roomNumber: 'OPD-204',
    averageConsultMinutes: 15,
    status: 'active',
  });

  // 5. Doctor 2 (Orthopedic at City Apex)
  const docUser2 = await User.create({
    name: 'Dr. Vikram Malhotra',
    email: 'doctor.vikram@midflow.ai',
    password: 'Password@123',
    phone: '+91-98000-00011',
    role: 'doctor',
    hospitalId: hospital1._id,
  });

  const docProfile2 = await DoctorProfile.create({
    userId: docUser2._id,
    hospitalId: hospital1._id,
    departmentId: deptOrtho1._id,
    specialization: 'Consultant Orthopedic Surgeon',
    qualification: 'MBBS, MS (Ortho)',
    experienceYears: 9,
    consultationFee: 650,
    roomNumber: 'OPD-108',
    averageConsultMinutes: 12,
    status: 'active',
  });

  // 6. Patient 1
  const patient1 = await User.create({
    name: 'Aman Khan',
    email: 'patient@midflow.ai',
    password: 'Password@123',
    phone: '+91-98765-43210',
    role: 'patient',
    patientProfile: {
      gender: 'male',
      age: 26,
      bloodGroup: 'B+',
      emergencyContact: '+91-98765-11111',
      address: '22 Park Lane, Mumbai',
    },
  });

  // 7. Patient 2
  const patient2 = await User.create({
    name: 'Priya Patel',
    email: 'priya@midflow.ai',
    password: 'Password@123',
    phone: '+91-98765-43211',
    role: 'patient',
    patientProfile: {
      gender: 'female',
      age: 29,
      bloodGroup: 'O+',
      emergencyContact: '+91-98765-22222',
      address: '404 Garden View, Delhi',
    },
  });

  console.log('Seeding Wards and Beds...');
  const icuWard = await Ward.create({
    hospitalId: hospital1._id,
    name: 'Intensive Cardiac Care Unit (ICCU)',
    type: 'ICU',
    floor: '2nd Floor',
    totalBeds: 6,
  });

  const generalWard = await Ward.create({
    hospitalId: hospital1._id,
    name: 'Male Surgical Ward (MSW)',
    type: 'General',
    floor: '1st Floor',
    totalBeds: 10,
  });

  // Create Beds for City Apex
  await Bed.create({
    hospitalId: hospital1._id,
    wardId: icuWard._id,
    bedNumber: 'ICU-BED-01',
    type: 'icu',
    status: 'occupied',
    currentAdmission: {
      patientName: 'Kishore Kumar',
      patientContact: '+91-98200-99999',
      admittedAt: new Date(Date.now() - 36 * 3600 * 1000),
      expectedDischargeAt: new Date(Date.now() + 24 * 3600 * 1000),
      notes: 'Post-angioplasty observation',
      admittedBy: hospitalAdmin1._id,
    },
  });

  await Bed.create({
    hospitalId: hospital1._id,
    wardId: icuWard._id,
    bedNumber: 'ICU-BED-02',
    type: 'icu',
    status: 'available',
  });

  await Bed.create({
    hospitalId: hospital1._id,
    wardId: generalWard._id,
    bedNumber: 'GEN-BED-101',
    type: 'standard',
    status: 'available',
  });

  await Bed.create({
    hospitalId: hospital1._id,
    wardId: generalWard._id,
    bedNumber: 'GEN-BED-102',
    type: 'standard',
    status: 'under_cleaning', // Needs sanitation before becoming available
  });

  await Bed.create({
    hospitalId: hospital1._id,
    wardId: generalWard._id,
    bedNumber: 'GEN-BED-103',
    type: 'standard',
    status: 'occupied',
    currentAdmission: {
      patientName: 'Rajesh Mehra',
      patientContact: '+91-98211-88888',
      admittedAt: new Date(Date.now() - 20 * 3600 * 1000),
      expectedDischargeAt: new Date(Date.now() + 6 * 3600 * 1000),
      notes: 'Fracture fixation recovery',
      admittedBy: hospitalAdmin1._id,
    },
  });

  console.log('Seeding Sample Appointments and Queue for Today...');
  const today = new Date().toISOString().split('T')[0];

  const appt1 = await Appointment.create({
    patientId: patient1._id,
    doctorId: docProfile1._id,
    hospitalId: hospital1._id,
    departmentId: deptCardio1._id,
    date: today,
    timeSlot: '10:00 AM',
    tokenNumber: 1,
    tokenCode: `MID-${today.replace(/-/g, '')}-001`,
    reason: 'Chest pain investigation & ECG review',
    status: 'in_consultation',
  });

  await QueueEntry.create({
    hospitalId: hospital1._id,
    doctorId: docProfile1._id,
    appointmentId: appt1._id,
    patientId: patient1._id,
    date: today,
    tokenNumber: 1,
    status: 'serving',
    calledAt: new Date(),
    estimatedWaitMinutes: 0,
  });

  const appt2 = await Appointment.create({
    patientId: patient2._id,
    doctorId: docProfile1._id,
    hospitalId: hospital1._id,
    departmentId: deptCardio1._id,
    date: today,
    timeSlot: '10:30 AM',
    tokenNumber: 2,
    tokenCode: `MID-${today.replace(/-/g, '')}-002`,
    reason: 'Hypertension checkup and medication refill',
    status: 'booked',
  });

  await QueueEntry.create({
    hospitalId: hospital1._id,
    doctorId: docProfile1._id,
    appointmentId: appt2._id,
    patientId: patient2._id,
    date: today,
    tokenNumber: 2,
    status: 'waiting',
    estimatedWaitMinutes: 15,
  });

  // Seed sample in-app notification
  await Notification.create({
    userId: patient1._id,
    title: 'Appointment Serving Now',
    message: 'Your token #1 has been called by Dr. Ananya Roy in OPD-204.',
    type: 'queue',
    read: false,
    data: { appointmentId: appt1._id, tokenNumber: 1 },
  });

  console.log('----------------------------------------------------');
  console.log('SEEDING COMPLETE! Demo Accounts Credentials:');
  console.log('1. Super Admin:    superadmin@midflow.ai  / Password@123');
  console.log('2. Hospital Admin: admin@cityapex.org     / Password@123');
  console.log('3. Doctor:         doctor.ananya@midflow.ai / Password@123');
  console.log('4. Patient:        patient@midflow.ai     / Password@123');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
};

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
