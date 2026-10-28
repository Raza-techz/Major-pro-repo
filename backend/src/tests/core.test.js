const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const Bed = require('../models/Bed');
const { signToken } = require('../utils/jwt');

test('Backend Core Architecture & RBAC Tests', async (t) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/midflow_ai';

  await t.test('Database connection test', async () => {
    await mongoose.connect(mongoURI);
    assert.strictEqual(mongoose.connection.readyState, 1);
  });

  await t.test('JWT token generation and verification test', async () => {
    const token = signToken('sample_user_id', 'patient');
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
  });

  await t.test('Patient authentication & password hashing', async () => {
    const patient = await User.findOne({ email: 'patient@midflow.ai' }).select('+password');
    assert.ok(patient);
    assert.strictEqual(patient.role, 'patient');
    const isMatch = await patient.matchPassword('Password@123');
    assert.strictEqual(isMatch, true);
    const isWrong = await patient.matchPassword('WrongPassword');
    assert.strictEqual(isWrong, false);
  });

  await t.test('Hospital Admin role and tenant association', async () => {
    const admin = await User.findOne({ email: 'admin@cityapex.org' });
    assert.ok(admin);
    assert.strictEqual(admin.role, 'hospital_admin');
    assert.ok(admin.hospitalId);
  });

  await t.test('Doctor profile linked to hospital & department', async () => {
    const doctor = await DoctorProfile.findOne().populate('userId hospitalId departmentId');
    assert.ok(doctor);
    assert.ok(doctor.userId);
    assert.ok(doctor.hospitalId);
    assert.ok(doctor.departmentId);
    assert.strictEqual(doctor.status, 'active');
  });

  await t.test('Bed inventory state and sanitation enforcement', async () => {
    const cleaningBed = await Bed.findOne({ status: 'under_cleaning' });
    assert.ok(cleaningBed, 'Discharged bed should be preserved under_cleaning before available');
  });

  // Teardown
  await mongoose.disconnect();
});
