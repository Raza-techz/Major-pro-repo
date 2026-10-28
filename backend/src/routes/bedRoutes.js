const express = require('express');
const router = express.Router();
const {
  getWards,
  createWard,
  getBeds,
  createBed,
  admitPatient,
  dischargePatient,
  updateBedStatus,
} = require('../controllers/bedController');
const { protect, authorize } = require('../middleware/auth');

router.get('/wards', protect, getWards);
router.post('/wards', protect, authorize('hospital_admin', 'super_admin'), createWard);
router.get('/', getBeds);
router.post('/', protect, authorize('hospital_admin', 'super_admin'), createBed);
router.post('/:id/admit', protect, authorize('hospital_admin'), admitPatient);
router.post('/:id/discharge', protect, authorize('hospital_admin'), dischargePatient);
router.put('/:id/status', protect, authorize('hospital_admin', 'super_admin'), updateBedStatus);

module.exports = router;
