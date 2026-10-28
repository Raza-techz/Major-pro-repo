const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const Bed = require('../models/Bed');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Get all active hospitals with optional city filter
// @route   GET /api/hospitals
// @access  Public
exports.getHospitals = async (req, res) => {
  try {
    const { city, status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    } else {
      // By default return active for public directory
      query.status = 'active';
    }
    if (city) query['address.city'] = new RegExp(city, 'i');

    const hospitals = await Hospital.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single hospital details
// @route   GET /api/hospitals/:id
// @access  Public
exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const departments = await Department.find({ hospitalId: hospital._id, status: 'active' });
    const doctorCount = await DoctorProfile.countDocuments({ hospitalId: hospital._id, status: 'active' });
    const beds = await Bed.find({ hospitalId: hospital._id });
    const bedSummary = {
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied: beds.filter((b) => b.status === 'occupied').length,
      underCleaning: beds.filter((b) => b.status === 'under_cleaning').length,
    };

    res.status(200).json({
      success: true,
      data: {
        hospital,
        departments,
        doctorCount,
        bedSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create hospital (Super Admin only)
// @route   POST /api/hospitals
// @access  Private (Super Admin)
exports.createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);

    await AuditLog.create({
      userId: req.user._id,
      hospitalId: hospital._id,
      action: 'HOSPITAL_CREATED',
      resource: 'Hospital',
      details: { name: hospital.name, code: hospital.code },
    });

    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update hospital details / status (Hospital Admin for own hospital or Super Admin)
// @route   PUT /api/hospitals/:id
// @access  Private (Hospital Admin or Super Admin)
exports.updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Role check: Hospital Admin can only edit their own hospital
    if (req.user.role === 'hospital_admin') {
      if (!req.user.hospitalId || req.user.hospitalId.toString() !== hospital._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: not your hospital' });
      }
      // Hospital Admin cannot change status (e.g. approve/suspend); only Super Admin can
      delete req.body.status;
    }

    const updated = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await AuditLog.create({
      userId: req.user._id,
      hospitalId: hospital._id,
      action: 'HOSPITAL_UPDATED',
      resource: 'Hospital',
      details: req.body,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
