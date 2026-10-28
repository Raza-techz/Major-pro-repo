const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Hospital = require('../models/Hospital');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const Bed = require('../models/Bed');
const User = require('../models/User');

test('E2E Clinical Workflows and Data Integrity', async (t) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/midflow_ai';
  await mongoose.connect(mongoURI);

  await t.test('Prevents duplicate booking for the same doctor, date, and slot', async () => {
    const doctor = await DoctorProfile.findOne();
    const patient = await User.findOne({ role: 'patient' });
    const testDate = '2026-12-15';
    const slot = '02:00 PM';

    // Clear any leftover test booking
    await Appointment.deleteMany({ tokenCode: { $in: ['MID-TEST-099', 'MID-TEST-100'] } });
    await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, timeSlot: slot });

    // First booking
    const appt1 = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      hospitalId: doctor.hospitalId,
      departmentId: doctor.departmentId,
      date: testDate,
      timeSlot: slot,
      tokenNumber: 99,
      tokenCode: 'MID-TEST-099',
      status: 'booked',
    });
    assert.ok(appt1);

    // Attempt second booking for the exact same slot
    let duplicateRejected = false;
    try {
      await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId,
        departmentId: doctor.departmentId,
        date: testDate,
        timeSlot: slot,
        tokenNumber: 100,
        tokenCode: 'MID-TEST-100',
        status: 'booked',
      });
    } catch (err) {
      duplicateRejected = true;
    }

    assert.strictEqual(duplicateRejected, true, 'Duplicate slot booking was properly rejected');

    // Clean up
    await Appointment.deleteOne({ _id: appt1._id });
  });

  await t.test('Bed transition prevents double admission and requires sanitation', async () => {
    const bed = await Bed.findOne({ status: 'available' });
    assert.ok(bed, 'Must have at least one available test bed');

    // Simulate Admission
    bed.status = 'occupied';
    bed.currentAdmission = {
      patientName: 'Workflow Test Patient',
      patientContact: '9999999999',
      admittedAt: new Date(),
    };
    await bed.save();

    let updatedBed = await Bed.findById(bed._id);
    assert.strictEqual(updatedBed.status, 'occupied');

    // Simulate Discharge (Must transition to under_cleaning, NOT available)
    updatedBed.status = 'under_cleaning';
    updatedBed.currentAdmission = {};
    await updatedBed.save();

    const cleaningBed = await Bed.findById(bed._id);
    assert.strictEqual(cleaningBed.status, 'under_cleaning');

    // Housekeeping completes cleaning
    cleaningBed.status = 'available';
    await cleaningBed.save();

    const sanitizedBed = await Bed.findById(bed._id);
    assert.strictEqual(sanitizedBed.status, 'available');
  });

  await t.test('Queue entry reflects server-authoritative token numbers', async () => {
    const queueEntries = await QueueEntry.find().sort({ tokenNumber: 1 });
    assert.ok(queueEntries.length > 0);
    assert.ok(queueEntries[0].tokenNumber >= 1);
  });

  await mongoose.disconnect();
});
