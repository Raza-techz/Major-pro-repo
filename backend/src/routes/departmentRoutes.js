const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDepartments);
router.post('/', protect, authorize('hospital_admin', 'super_admin'), createDepartment);
router.put('/:id', protect, authorize('hospital_admin', 'super_admin'), updateDepartment);

module.exports = router;
