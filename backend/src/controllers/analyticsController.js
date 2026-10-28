const Appointment = require('../models/Appointment');
const Bed = require('../models/Bed');
const DoctorProfile = require('../models/DoctorProfile');
const QueueEntry = require('../models/QueueEntry');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// @desc    Get explainable waiting-time analytics and prediction report for a doctor
// @route   GET /api/analytics/waiting-time/:doctorId
// @access  Public
exports.getWaitingTimeAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name').populate('hospitalId', 'name');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const queueEntries = await QueueEntry.find({ doctorId, date }).sort({ tokenNumber: 1 });
    const completedEntries = queueEntries.filter((q) => q.status === 'completed' && q.calledAt && q.servedAt);

    // Compute actual historical consultation durations if available
    let totalConsultTime = 0;
    completedEntries.forEach((entry) => {
      const diffMs = new Date(entry.servedAt) - new Date(entry.calledAt);
      const minutes = Math.round(diffMs / 60000);
      if (minutes > 0 && minutes < 120) totalConsultTime += minutes;
    });

    const calculatedAvg = completedEntries.length > 0
      ? Math.round(totalConsultTime / completedEntries.length)
      : doctor.averageConsultMinutes || 15;

    const waitingPatients = queueEntries.filter((q) => q.status === 'waiting');
    const servingPatient = queueEntries.find((q) => q.status === 'serving');

    // Forecast queue clearing time:
    const remainingMinutes = waitingPatients.length * calculatedAvg;
    const now = new Date();
    const estimatedClearanceTime = new Date(now.getTime() + remainingMinutes * 60000);

    res.status(200).json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.userId ? doctor.userId.name : 'Doctor',
        hospitalName: doctor.hospitalId ? doctor.hospitalId.name : '',
        date,
        modelType: 'Linear Queue State Estimator with Moving Average Baseline',
        parameters: {
          baselineAverageMinutes: doctor.averageConsultMinutes || 15,
          observedAverageMinutes: calculatedAvg,
          sampleSizeCompletedToday: completedEntries.length,
          currentlyWaitingCount: waitingPatients.length,
          servingToken: servingPatient ? servingPatient.tokenNumber : null,
        },
        forecast: {
          estimatedQueueDurationMinutes: remainingMinutes,
          estimatedClearanceTime: estimatedClearanceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          confidenceInterval: '± 5-10 minutes depending on individual clinical complexity',
        },
        disclaimer: 'This projection is an algorithmic operational estimate. Actual medical consultation times vary based on emergency cases and patient symptoms.',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hospital resource optimization recommendations
// @route   GET /api/analytics/hospital-optimization
// @access  Private (Hospital Admin, Super Admin)
exports.getHospitalOptimization = async (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || (req.user && req.user.hospitalId);
    if (!hospitalId) {
      return res.status(400).json({ success: false, message: 'Hospital ID is required' });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Bed metrics
    const beds = await Bed.find({ hospitalId });
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
    const underCleaningBeds = beds.filter((b) => b.status === 'under_cleaning').length;
    const availableBeds = beds.filter((b) => b.status === 'available').length;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Detect beds needing sanitation attention
    const cleaningBacklog = underCleaningBeds;

    // 2. Doctor workload & OPD load
    const doctors = await DoctorProfile.find({ hospitalId, status: 'active' }).populate('userId', 'name').populate('departmentId', 'name');
    const doctorWorkload = await Promise.all(
      doctors.map(async (doc) => {
        const appointmentCount = await Appointment.countDocuments({
          doctorId: doc._id,
          date: today,
          status: { $in: ['booked', 'confirmed', 'in_consultation', 'completed'] },
        });

        const waitingCount = await QueueEntry.countDocuments({
          doctorId: doc._id,
          date: today,
          status: 'waiting',
        });

        return {
          doctorId: doc._id,
          doctorName: doc.userId ? doc.userId.name : 'Doctor',
          department: doc.departmentId ? doc.departmentId.name : 'General',
          todayAppointments: appointmentCount,
          activeWaiting: waitingCount,
          isHighLoad: appointmentCount >= 10,
        };
      })
    );

    // 3. Actionable explainable recommendations engine
    const recommendations = [];

    if (bedOccupancyRate >= 85) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Bed Capacity Alert',
        insight: `Bed occupancy is critically high at ${bedOccupancyRate}% (${occupiedBeds}/${totalBeds} beds occupied).`,
        action: 'Prioritize discharge rounds for non-critical ward patients and expedite housekeeping sanitization.',
      });
    }

    if (cleaningBacklog > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Housekeeping Sanitation',
        insight: `${cleaningBacklog} discharged bed(s) are currently marked 'under_cleaning'.`,
        action: 'Dispatch housekeeping staff to sanitize and mark these beds available to relieve waiting patients.',
      });
    }

    const overloadedDoctors = doctorWorkload.filter((d) => d.isHighLoad);
    if (overloadedDoctors.length > 0) {
      const names = overloadedDoctors.map((d) => d.doctorName).join(', ');
      recommendations.push({
        priority: 'HIGH',
        category: 'OPD Congestion',
        insight: `High OPD patient volume detected for: ${names}.`,
        action: 'Consider opening supplementary consultation desks or extending shift slots to avoid excessive patient waiting times.',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Balanced Operations',
        insight: 'Hospital operations and patient distribution are currently optimal within safety thresholds.',
        action: 'Maintain standard monitoring and scheduled OPD transitions.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hospitalId,
        date: today,
        bedMetrics: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: availableBeds,
          underCleaning: underCleaningBeds,
          occupancyRatePercent: bedOccupancyRate,
        },
        doctorWorkload,
        recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform-wide Super Admin analytics
// @route   GET /api/analytics/platform
// @access  Private (Super Admin)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const activeHospitals = await Hospital.countDocuments({ status: 'active' });
    const totalDoctors = await DoctorProfile.countDocuments({ status: 'active' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalAppointments = await Appointment.countDocuments();
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await Appointment.countDocuments({ date: today });
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: 'occupied' });

    res.status(200).json({
      success: true,
      data: {
        hospitals: { total: totalHospitals, active: activeHospitals },
        users: { totalDoctors, totalPatients },
        appointments: { total: totalAppointments, today: todayAppointments },
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: Math.max(0, totalBeds - occupiedBeds),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
