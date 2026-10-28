const express = require('express');
const router = express.Router();
const {
  getDoctorSlots,
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/slots', getDoctorSlots);
router.post('/', protect, bookAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

module.exports = router;
