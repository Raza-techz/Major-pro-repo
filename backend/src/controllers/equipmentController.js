const Equipment = require('../models/Equipment');
const AuditLog = require('../models/AuditLog');

// @desc    Get equipment list
// @route   GET /api/equipment
// @access  Private
exports.getEquipment = async (req, res) => {
  try {
    const { hospitalId, departmentId, category, status } = req.query;
    const filter = {};
    if (hospitalId) filter.hospitalId = hospitalId;
    else if (req.user && req.user.hospitalId) filter.hospitalId = req.user.hospitalId;

    if (departmentId) filter.departmentId = departmentId;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const list = await Equipment.find(filter)
      .populate('hospitalId', 'name code')
      .populate('departmentId', 'name')
      .sort({ name: 1 });

    const summary = {
      total: list.length,
      available: list.filter((e) => e.status === 'available').length,
      inUse: list.filter((e) => e.status === 'in_use').length,
      maintenance: list.filter((e) => e.status === 'under_maintenance').length,
    };

    res.status(200).json({ success: true, count: list.length, summary, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Private (Hospital Admin, Super Admin)
exports.createEquipment = async (req, res) => {
  try {
    const targetHospitalId = req.user.role === 'hospital_admin' ? req.user.hospitalId : req.body.hospitalId;
    const count = await Equipment.countDocuments({ hospitalId: targetHospitalId });
    const equipmentId = req.body.equipmentId || `EQP-${Date.now().toString().slice(-4)}-${count + 1}`;

    const eq = await Equipment.create({
      ...req.body,
      equipmentId,
      hospitalId: targetHospitalId,
    });

    await AuditLog.create({
      userId: req.user._id,
      hospitalId: targetHospitalId,
      action: 'EQUIPMENT_ADDED',
      resource: 'Equipment',
      details: { name: eq.name, equipmentId: eq.equipmentId },
    });

    res.status(201).json({ success: true, data: eq });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Hospital Admin, Super Admin)
exports.updateEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findById(req.params.id);
    if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });

    if (req.user.role === 'hospital_admin' && eq.hospitalId.toString() !== req.user.hospitalId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
    }

    const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

