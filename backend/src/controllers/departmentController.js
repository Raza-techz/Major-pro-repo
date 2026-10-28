const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

// @desc    Get departments by hospital
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const query = { status: 'active' };
    if (hospitalId) query.hospitalId = hospitalId;

    const departments = await Department.find(query).populate('hospitalId', 'name code');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Hospital Admin, Super Admin)
exports.createDepartment = async (req, res) => {
  try {
    const { hospitalId, name, description, locationFloor } = req.body;

    if (req.user.role === 'hospital_admin') {
      if (req.user.hospitalId.toString() !== hospitalId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: cannot manage another hospital' });
      }
    }

    const dept = await Department.create({
      hospitalId,
      name,
      description,
      locationFloor,
    });

    await AuditLog.create({
      userId: req.user._id,
      hospitalId,
      action: 'DEPARTMENT_CREATED',
      resource: 'Department',
      details: { name, departmentId: dept._id },
    });

    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Hospital Admin, Super Admin)
exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (req.user.role === 'hospital_admin') {
      if (req.user.hospitalId.toString() !== dept.hospitalId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this hospital' });
      }
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
