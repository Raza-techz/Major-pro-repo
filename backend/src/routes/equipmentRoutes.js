const express = require('express');
const router = express.Router();
const { getEquipment, createEquipment, updateEquipment } = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getEquipment);
router.post('/', protect, authorize('hospital_admin', 'super_admin'), createEquipment);
router.put('/:id', protect, authorize('hospital_admin', 'super_admin'), updateEquipment);

module.exports = router;

