const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
      default: null,
    },
    category: {
      type: String,
      enum: ['Radiology', 'Cardiology', 'Critical Care', 'Surgical', 'General Diagnostic', 'Laboratory', 'Oncology'],
      default: 'General Diagnostic',
    },
    manufacturer: { type: String, default: '' },
    model: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['available', 'in_use', 'under_maintenance', 'out_of_service'],
      default: 'available',
      index: true,
    },
    location: { type: String, default: 'Main Diagnostic Wing' },
    lastMaintenanceDate: { type: Date, default: null },
    nextMaintenanceDate: { type: Date, default: null },
    usageCharge: { type: Number, default: 0 },
    billingUnit: {
      type: String,
      enum: ['per scan', 'per session', 'per hour', 'per day', 'flat fee'],
      default: 'per scan',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);

