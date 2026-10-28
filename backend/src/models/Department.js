const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    locationFloor: {
      type: String,
      default: 'Ground Floor',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Prevent duplicate department names within the same hospital
departmentSchema.index({ hospitalId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
