const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.post('/', protect, authorize('super_admin'), createHospital);
router.put('/:id', protect, authorize('hospital_admin', 'super_admin'), updateHospital);

module.exports = router;
