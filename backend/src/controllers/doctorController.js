const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all active doctors with hospital, department, and user details
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { hospitalId, departmentId, search } = req.query;
    const filter = { status: 'active' };

    if (hospitalId) filter.hospitalId = hospitalId;
    if (departmentId) filter.departmentId = departmentId;

    const doctors = await DoctorProfile.find(filter)
      .populate('userId', 'name email phone')
      .populate('hospitalId', 'name code address')
      .populate('departmentId', 'name locationFloor')
      .sort({ createdAt: -1 });

    let results = doctors;
    if (search) {
      const s = search.toLowerCase();
      results = doctors.filter(
        (doc) =>
          (doc.userId && doc.userId.name.toLowerCase().includes(s)) ||
          doc.specialization.toLowerCase().includes(s) ||
          (doc.departmentId && doc.departmentId.name.toLowerCase().includes(s))
      );
    }

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single doctor profile
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('hospitalId', 'name code address operatingHours')
      .populate('departmentId', 'name locationFloor description');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Provision/Create doctor account and profile (Hospital Admin or Super Admin)
// @route   POST /api/doctors
// @access  Private (Hospital Admin, Super Admin)
exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      hospitalId,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      roomNumber,
      averageConsultMinutes,
      workingDays,
      shiftStart,
      shiftEnd,
    } = req.body;

    // Enforce tenant boundary
    if (req.user.role === 'hospital_admin') {
      if (req.user.hospitalId.toString() !== hospitalId) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
      }
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user with doctor role
    const doctorUser = await User.create({
      name,
      email,
      password: password || 'Doctor@1234',
      phone: phone || '',
      role: 'doctor',
      hospitalId,
    });

    const doctorProfile = await DoctorProfile.create({
      userId: doctorUser._id,
      hospitalId,
      departmentId,
      specialization,
      qualification: qualification || 'MBBS, MD',
      experienceYears: experienceYears || 5,
      consultationFee: consultationFee || 500,
      roomNumber: roomNumber || 'OPD-1',
      averageConsultMinutes: averageConsultMinutes || 15,
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      shiftStart: shiftStart || '09:00',
      shiftEnd: shiftEnd || '17:00',
      status: 'active',
    });

    await AuditLog.create({
      userId: req.user._id,
      hospitalId,
      action: 'DOCTOR_PROVISIONED',
      resource: 'DoctorProfile',
      details: { doctorId: doctorProfile._id, email, name },
    });

    res.status(201).json({
      success: true,
      message: 'Doctor provisioned successfully',
      data: doctorProfile,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update doctor profile / status
// @route   PUT /api/doctors/:id
// @access  Private (Doctor for own profile, Hospital Admin, Super Admin)
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (req.user.role === 'doctor') {
      if (doctor.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot modify another doctor profile' });
      }
      // Doctors can only toggle availability or shift hours
      const allowed = ['isAvailable', 'averageConsultMinutes'];
      Object.keys(req.body).forEach((key) => {
        if (allowed.includes(key)) {
          doctor[key] = req.body[key];
        }
      });
      await doctor.save();
      return res.status(200).json({ success: true, data: doctor });
    }

    if (req.user.role === 'hospital_admin') {
      if (req.user.hospitalId.toString() !== doctor.hospitalId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
      }
    }

    const updated = await DoctorProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
