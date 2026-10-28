const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
      index: true,
    },
    bedNumber: {
      type: String, // e.g. "BED-G-01"
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['standard', 'icu', 'ventilator', 'pediatric'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'under_cleaning', 'out_of_service'],
      default: 'available',
      index: true,
    },
    // Active admission details if occupied
    currentAdmission: {
      patientName: { type: String, default: null },
      patientContact: { type: String, default: null },
      admittedAt: { type: Date, default: null },
      expectedDischargeAt: { type: Date, default: null },
      notes: { type: String, default: null },
      admittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    lastStatusChange: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

bedSchema.index({ hospitalId: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
