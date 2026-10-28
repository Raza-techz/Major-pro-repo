const express = require('express');
const router = express.Router();
const {
  getWaitingTimeAnalytics,
  getHospitalOptimization,
  getPlatformAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/waiting-time/:doctorId', getWaitingTimeAnalytics);
router.get('/hospital-optimization', protect, authorize('hospital_admin', 'super_admin'), getHospitalOptimization);
router.get('/platform', protect, authorize('super_admin'), getPlatformAnalytics);

module.exports = router;
