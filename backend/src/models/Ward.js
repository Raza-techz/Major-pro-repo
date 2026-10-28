const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity', 'Surgical'],
      default: 'General',
    },
    floor: {
      type: String,
      default: '1st Floor',
    },
    totalBeds: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ward', wardSchema);
