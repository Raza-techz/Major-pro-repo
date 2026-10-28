const Bed = require('../models/Bed');
const Ward = require('../models/Ward');
const AuditLog = require('../models/AuditLog');

// @desc    Get wards for a hospital
// @route   GET /api/beds/wards
// @access  Private (Hospital Admin, Super Admin, Doctor)
exports.getWards = async (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || (req.user && req.user.hospitalId);
    if (!hospitalId) {
      return res.status(400).json({ success: false, message: 'Hospital ID required' });
    }

    const wards = await Ward.find({ hospitalId });
    res.status(200).json({ success: true, count: wards.length, data: wards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new ward
// @route   POST /api/beds/wards
// @access  Private (Hospital Admin, Super Admin)
exports.createWard = async (req, res) => {
  try {
    const { hospitalId, name, type, floor, totalBeds } = req.body;
    const targetHospitalId = req.user.role === 'hospital_admin' ? req.user.hospitalId : hospitalId;

    const ward = await Ward.create({
      hospitalId: targetHospitalId,
      name,
      type,
      floor,
      totalBeds: totalBeds || 10,
    });

    res.status(201).json({ success: true, data: ward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get beds inventory by hospital
// @route   GET /api/beds
// @access  Public/Private
exports.getBeds = async (req, res) => {
  try {
    const { hospitalId, wardId, status, type } = req.query;
    const query = {};

    if (hospitalId) query.hospitalId = hospitalId;
    else if (req.user && req.user.hospitalId) query.hospitalId = req.user.hospitalId;

    if (wardId) query.wardId = wardId;
    if (status) query.status = status;
    if (type) query.type = type;

    const beds = await Bed.find(query)
      .populate('wardId', 'name type floor')
      .populate('hospitalId', 'name code')
      .sort({ bedNumber: 1 });

    const summary = {
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied: beds.filter((b) => b.status === 'occupied').length,
      reserved: beds.filter((b) => b.status === 'reserved').length,
      under_cleaning: beds.filter((b) => b.status === 'under_cleaning').length,
      out_of_service: beds.filter((b) => b.status === 'out_of_service').length,
    };

    res.status(200).json({ success: true, summary, count: beds.length, data: beds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new bed (Hospital Admin, Super Admin)
// @route   POST /api/beds
// @access  Private (Hospital Admin, Super Admin)
exports.createBed = async (req, res) => {
  try {
    const { hospitalId, wardId, bedNumber, type } = req.body;
    const targetHospitalId = req.user.role === 'hospital_admin' ? req.user.hospitalId : hospitalId;

    // Check duplicate bedNumber
    const existing = await Bed.findOne({ hospitalId: targetHospitalId, bedNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Bed ${bedNumber} already exists in this hospital` });
    }

    const bed = await Bed.create({
      hospitalId: targetHospitalId,
      wardId,
      bedNumber,
      type: type || 'standard',
      status: 'available',
    });

    res.status(201).json({ success: true, data: bed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admit patient to a bed
// @route   POST /api/beds/:id/admit
// @access  Private (Hospital Admin)
exports.admitPatient = async (req, res) => {
  try {
    const { patientName, patientContact, expectedDischargeAt, notes } = req.body;
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    // Tenant check
    if (req.user.role === 'hospital_admin' && bed.hospitalId.toString() !== req.user.hospitalId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
    }

    if (bed.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} cannot be assigned because its current status is '${bed.status}'. Beds must be 'available'.`,
      });
    }

    bed.status = 'occupied';
    bed.currentAdmission = {
      patientName,
      patientContact: patientContact || '',
      admittedAt: new Date(),
      expectedDischargeAt: expectedDischargeAt ? new Date(expectedDischargeAt) : null,
      notes: notes || '',
      admittedBy: req.user._id,
    };
    bed.lastStatusChange = new Date();
    await bed.save();

    await AuditLog.create({
      userId: req.user._id,
      hospitalId: bed.hospitalId,
      action: 'BED_ADMITTED',
      resource: 'Bed',
      details: { bedNumber: bed.bedNumber, patientName, expectedDischargeAt },
    });

    res.status(200).json({ success: true, message: `Bed ${bed.bedNumber} assigned to ${patientName}`, data: bed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Discharge patient from bed (Enforces 'under_cleaning' status)
// @route   POST /api/beds/:id/discharge
// @access  Private (Hospital Admin)
exports.dischargePatient = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (req.user.role === 'hospital_admin' && bed.hospitalId.toString() !== req.user.hospitalId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
    }

    if (bed.status !== 'occupied') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} is not currently occupied`,
      });
    }

    const previousPatient = bed.currentAdmission ? bed.currentAdmission.patientName : 'Unknown';

    // Transition to 'under_cleaning' to enforce sanitation workflow
    bed.status = 'under_cleaning';
    bed.currentAdmission = {
      patientName: null,
      patientContact: null,
      admittedAt: null,
      expectedDischargeAt: null,
      notes: null,
      admittedBy: null,
    };
    bed.lastStatusChange = new Date();
    await bed.save();

    await AuditLog.create({
      userId: req.user._id,
      hospitalId: bed.hospitalId,
      action: 'BED_DISCHARGED',
      resource: 'Bed',
      details: { bedNumber: bed.bedNumber, dischargedPatient: previousPatient, nextStatus: 'under_cleaning' },
    });

    res.status(200).json({
      success: true,
      message: `Patient discharged. Bed ${bed.bedNumber} is now marked 'under_cleaning' for sanitation.`,
      data: bed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete cleaning / update status to available or maintenance
// @route   PUT /api/beds/:id/status
// @access  Private (Hospital Admin, Super Admin)
exports.updateBedStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'under_cleaning', 'out_of_service', 'reserved'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Choose from: ${allowed.join(', ')}` });
    }

    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (req.user.role === 'hospital_admin' && bed.hospitalId.toString() !== req.user.hospitalId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
    }

    bed.status = status;
    bed.lastStatusChange = new Date();
    await bed.save();

    res.status(200).json({ success: true, message: `Bed status updated to ${status}`, data: bed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
