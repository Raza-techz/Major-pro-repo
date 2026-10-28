const express = require('express');
const router = express.Router();
const {
  getDoctorQueue,
  getPatientQueuePosition,
  callNextPatient,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/auth');

router.get('/doctor/:doctorId', getDoctorQueue);
router.get('/patient/:appointmentId', protect, getPatientQueuePosition);
router.post('/call-next', protect, authorize('doctor'), callNextPatient);

module.exports = router;
