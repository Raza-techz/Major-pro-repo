const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const DoctorProfile = require('../models/DoctorProfile');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Generate safe time slots (e.g., 09:00 AM to 04:30 PM in 30 min intervals)
const generateTimeSlots = () => {
  return [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM'
  ];
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/appointments/slots
// @access  Public
exports.getDoctorSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date (YYYY-MM-DD) are required' });
    }

    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const allSlots = generateTimeSlots();

    // Query active appointments already booked for this doctor & date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['booked', 'confirmed', 'in_consultation'] },
    }).select('timeSlot tokenNumber');

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);

    const slotAvailability = allSlots.map((slot) => ({
      slot,
      isAvailable: !bookedSlots.includes(slot),
    }));

    res.status(200).json({
      success: true,
      data: {
        date,
        doctorId,
        slots: slotAvailability,
        bookedCount: bookedAppointments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Book an appointment (Patient)
// @route   POST /api/appointments
// @access  Private
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;
    const patientId = req.user._id;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'doctorId, date, and timeSlot are required' });
    }

    const doctor = await DoctorProfile.findById(doctorId).populate('hospitalId departmentId');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Check if hospital is suspended
    if (doctor.hospitalId && doctor.hospitalId.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This hospital is currently suspended and cannot accept new appointments.',
      });
    }

    // Check if slot is already booked
    const existingSlot = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $in: ['booked', 'confirmed', 'in_consultation'] },
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose an available time slot.',
      });
    }

    // Check if patient already booked with this doctor on the same date
    const existingPatientBooking = await Appointment.findOne({
      patientId,
      doctorId,
      date,
      status: { $in: ['booked', 'confirmed', 'in_consultation'] },
    });

    if (existingPatientBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active appointment scheduled with this doctor on the selected date.',
      });
    }

    // Server-authoritative token generation:
    // Determine the next token number for this doctor on this date
    const countToday = await Appointment.countDocuments({ doctorId, date });
    const tokenNumber = countToday + 1;
    const dateCode = date.replace(/-/g, '');
    const tokenCode = `MID-${dateCode}-${String(tokenNumber).padStart(3, '0')}`;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      hospitalId: doctor.hospitalId._id,
      departmentId: doctor.departmentId._id,
      date,
      timeSlot,
      tokenNumber,
      tokenCode,
      reason: reason || 'Routine Checkup',
      status: 'booked',
    });

    // Create corresponding QueueEntry
    const queueEntry = await QueueEntry.create({
      hospitalId: doctor.hospitalId._id,
      doctorId,
      appointmentId: appointment._id,
      patientId,
      date,
      tokenNumber,
      status: 'waiting',
      estimatedWaitMinutes: Math.max(0, (tokenNumber - 1) * (doctor.averageConsultMinutes || 15)),
    });

    // Send in-app notification to patient
    await Notification.create({
      userId: patientId,
      title: 'Appointment Booked Successfully',
      message: `Your appointment with Dr. is confirmed for ${date} at ${timeSlot}. Token Number: #${tokenNumber}.`,
      type: 'booking',
      data: { appointmentId: appointment._id, tokenCode, tokenNumber },
    });

    // Broadcast queue update via socket if io instance is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(`hospital:${doctor.hospitalId._id}`).emit('queue:updated', {
        doctorId,
        tokenNumber,
        action: 'NEW_BOOKING',
      });
      io.to(`doctor:${doctorId}`).emit('queue:updated', {
        doctorId,
        tokenNumber,
        action: 'NEW_BOOKING',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed',
      data: {
        appointment,
        queueEntry,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user appointments (Patients get own; Doctors get assigned; Admins get hospital-wide)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    const filter = {};
    const { status, date, doctorId } = req.query;

    if (status) filter.status = status;
    if (date) filter.date = date;

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const docProfile = await DoctorProfile.findOne({ userId: req.user._id });
      if (!docProfile) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      filter.doctorId = docProfile._id;
    } else if (req.user.role === 'hospital_admin') {
      filter.hospitalId = req.user.hospitalId;
      if (doctorId) filter.doctorId = doctorId;
    } else if (req.user.role === 'super_admin') {
      if (req.query.hospitalId) filter.hospitalId = req.query.hospitalId;
      if (doctorId) filter.doctorId = doctorId;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone patientProfile')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('hospitalId', 'name code address')
      .populate('departmentId', 'name locationFloor')
      .sort({ date: -1, tokenNumber: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone patientProfile')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('hospitalId', 'name code address operatingHours')
      .populate('departmentId', 'name locationFloor');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Role safety checks
    if (req.user.role === 'patient' && appointment.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: not your appointment' });
    }
    if (req.user.role === 'hospital_admin' && appointment.hospitalId._id.toString() !== req.user.hospitalId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: different hospital' });
    }

    // Fetch queue info for waiting time
    const queue = await QueueEntry.findOne({ appointmentId: appointment._id });

    res.status(200).json({
      success: true,
      data: {
        appointment,
        queue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Patients can only cancel their own
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment that is already ${appointment.status}`,
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelled by user';
    await appointment.save();

    // Release queue entry
    await QueueEntry.findOneAndUpdate(
      { appointmentId: appointment._id },
      { status: 'cancelled' }
    );

    // Notify patient
    await Notification.create({
      userId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment for ${appointment.date} (${appointment.tokenCode}) has been cancelled.`,
      type: 'cancellation',
      data: { appointmentId: appointment._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor:${appointment.doctorId}`).emit('queue:updated', {
        appointmentId: appointment._id,
        status: 'cancelled',
      });
    }

    res.status(200).json({ success: true, message: 'Appointment cancelled successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment consultation status (Doctor only)
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, doctorNotes, prescription } = req.body;
    const validTransitions = ['in_consultation', 'completed', 'no_show'];

    if (!validTransitions.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid consultation status transition' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify doctor identity
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile || doctorProfile._id.toString() !== appointment.doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: you are not assigned to this appointment' });
    }

    appointment.status = status;
    if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
    if (prescription !== undefined) appointment.prescription = prescription;
    await appointment.save();

    // Synchronize queue entry
    const queueStatusMap = {
      in_consultation: 'serving',
      completed: 'completed',
      no_show: 'skipped',
    };

    const updateFields = { status: queueStatusMap[status] };
    if (status === 'in_consultation') updateFields.calledAt = new Date();
    if (status === 'completed') updateFields.servedAt = new Date();

    await QueueEntry.findOneAndUpdate({ appointmentId: appointment._id }, updateFields);

    // Notify patient
    await Notification.create({
      userId: appointment.patientId,
      title: `Consultation ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your appointment status with Dr. has been updated to ${status.replace('_', ' ')}.`,
      type: 'queue',
      data: { appointmentId: appointment._id, status },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`doctor:${appointment.doctorId}`).emit('queue:doctorUpdate', {
        appointmentId: appointment._id,
        tokenNumber: appointment.tokenNumber,
        status,
      });
      io.to(`user:${appointment.patientId}`).emit('queue:updated', {
        tokenNumber: appointment.tokenNumber,
        status,
      });
    }

    res.status(200).json({ success: true, message: 'Status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
