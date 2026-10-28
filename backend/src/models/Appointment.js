const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    timeSlot: {
      type: String, // Format: 09:30 AM
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    tokenCode: {
      type: String, // e.g. "MID-20261023-014"
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      default: 'Routine Consultation',
    },
    status: {
      type: String,
      enum: ['booked', 'confirmed', 'in_consultation', 'completed', 'cancelled', 'no_show'],
      default: 'booked',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    doctorNotes: {
      type: String,
      default: '',
    },
    prescription: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Application-level conflict prevention hook
appointmentSchema.pre('save', async function () {
  if (this.isNew && ['booked', 'confirmed', 'in_consultation'].includes(this.status)) {
    const existing = await this.constructor.findOne({
      doctorId: this.doctorId,
      date: this.date,
      timeSlot: this.timeSlot,
      status: { $in: ['booked', 'confirmed', 'in_consultation'] },
    });
    if (existing) {
      const err = new Error(`Slot '${this.timeSlot}' on ${this.date} is already booked for this doctor.`);
      err.code = 11000;
      throw err;
    }
  }
});

// Prevent duplicate active booking for the exact same doctor, date, and slot
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1, status: 1 },
  { unique: true, name: 'unique_slot_booking' }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
