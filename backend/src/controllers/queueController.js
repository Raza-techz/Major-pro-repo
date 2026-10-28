const QueueEntry = require('../models/QueueEntry');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Get live queue state for a doctor on a specific date
// @route   GET /api/queue/doctor/:doctorId
// @access  Public
exports.getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const queueEntries = await QueueEntry.find({ doctorId, date })
      .populate('patientId', 'name phone')
      .populate('appointmentId', 'tokenCode timeSlot reason status')
      .sort({ tokenNumber: 1 });

    const servingEntry = queueEntries.find((q) => q.status === 'serving') || null;
    const waitingEntries = queueEntries.filter((q) => q.status === 'waiting');
    const completedEntries = queueEntries.filter((q) => q.status === 'completed');

    // Calculate dynamic explainable waiting time:
    // (patients ahead in waiting queue) * average consultation duration
    const avgMinutes = doctor.averageConsultMinutes || 15;

    res.status(200).json({
      success: true,
      data: {
        date,
        doctorId,
        doctorName: doctor.userId ? doctor.userId.name : 'Doctor',
        currentServingToken: servingEntry ? servingEntry.tokenNumber : null,
        currentServingEntry: servingEntry,
        totalInQueue: queueEntries.length,
        waitingCount: waitingEntries.length,
        completedCount: completedEntries.length,
        averageConsultMinutes: avgMinutes,
        queue: queueEntries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live position for a patient's appointment
// @route   GET /api/queue/patient/:appointmentId
// @access  Private
exports.getPatientQueuePosition = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const entry = await QueueEntry.findOne({ appointmentId })
      .populate('doctorId')
      .populate('patientId', 'name');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue record not found' });
    }

    // Role safety
    if (req.user.role === 'patient' && entry.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to queue position' });
    }

    const doctor = await DoctorProfile.findById(entry.doctorId).populate('userId', 'name');
    const avgMinutes = doctor ? doctor.averageConsultMinutes || 15 : 15;

    // Count how many patients are waiting ahead of this token
    const patientsAhead = await QueueEntry.countDocuments({
      doctorId: entry.doctorId,
      date: entry.date,
      tokenNumber: { $lt: entry.tokenNumber },
      status: { $in: ['waiting', 'serving'] },
    });

    const currentlyServing = await QueueEntry.findOne({
      doctorId: entry.doctorId,
      date: entry.date,
      status: 'serving',
    });

    const estimatedWaitMinutes = Math.max(0, patientsAhead * avgMinutes);

    res.status(200).json({
      success: true,
      data: {
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        date: entry.date,
        currentServingToken: currentlyServing ? currentlyServing.tokenNumber : null,
        patientsAhead,
        estimatedWaitMinutes,
        calculationDetails: {
          formula: 'patients_ahead * average_consultation_time',
          averageConsultMinutes: avgMinutes,
          note: 'Estimates are advisory based on historical clinic averages and subject to patient consultation complexity.',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Call next patient in queue (Doctor only)
// @route   POST /api/queue/call-next
// @access  Private (Doctor)
exports.callNextPatient = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const date = new Date().toISOString().split('T')[0];

    // Mark any existing currently serving token as completed
    const currentServing = await QueueEntry.findOne({
      doctorId: doctorProfile._id,
      date,
      status: 'serving',
    });

    if (currentServing) {
      currentServing.status = 'completed';
      currentServing.servedAt = new Date();
      await currentServing.save();
    }

    // Find next waiting queue entry
    const nextEntry = await QueueEntry.findOne({
      doctorId: doctorProfile._id,
      date,
      status: 'waiting',
    })
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'name phone');

    if (!nextEntry) {
      return res.status(200).json({
        success: true,
        message: 'No more patients waiting in queue for today',
        data: null,
      });
    }

    nextEntry.status = 'serving';
    nextEntry.calledAt = new Date();
    await nextEntry.save();

    // Broadcast socket update
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor:${doctorProfile._id}`).emit('queue:doctorUpdate', {
        action: 'CALL_NEXT',
        currentServingToken: nextEntry.tokenNumber,
      });
      io.to(`user:${nextEntry.patientId._id}`).emit('queue:updated', {
        action: 'NOW_SERVING',
        tokenNumber: nextEntry.tokenNumber,
        message: 'You have been called for your consultation.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Token #${nextEntry.tokenNumber} is now serving`,
      data: nextEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
