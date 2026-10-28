const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', protect, authorize('hospital_admin', 'super_admin'), createDoctor);
router.put('/:id', protect, authorize('doctor', 'hospital_admin', 'super_admin'), updateDoctor);

module.exports = router;
