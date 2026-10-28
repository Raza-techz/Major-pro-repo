const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

queueEntrySchema.index({ doctorId: 1, date: 1, tokenNumber: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
