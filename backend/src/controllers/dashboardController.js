import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get full dashboard overview summary
 * GET /api/dashboard
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Welcome message based on current hour
  const hour = now.getHours();
  let greeting = "Hello";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const welcomeMessage = `${greeting}, ${req.user.fullName.split(" ")[0]}!`;

  // Start and end of today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Queries
  const [
    totalAppointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalMedications,
    takenToday,
    missedToday,
    skippedToday,
    unreadNotifications,
    recentActivitiesCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: { userId } }),
    prisma.appointment.count({ where: { userId, status: "Upcoming" } }),
    prisma.appointment.count({ where: { userId, status: "Completed" } }),
    prisma.appointment.count({ where: { userId, status: "Cancelled" } }),
    prisma.medication.count({ where: { userId } }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Taken",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Missed",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Skipped",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.activityLog.count({ where: { userId } }),
  ]);

  // Overall compliance calculations
  const allLogs = await prisma.reminderHistory.findMany({
    where: { medication: { userId } },
  });
  const totalLogs = allLogs.length;
  const takenLogs = allLogs.filter((l) => l.status === "Taken").length;
  const compliancePercentage = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  const pendingToday = Math.max(0, totalMedications - (takenToday + missedToday + skippedToday));

  res.status(200).json(
    successResponse("Dashboard summary loaded successfully", {
      user: {
        fullName: req.user.fullName,
        profileImage: req.user.profileImage,
      },
      welcomeMessage,
      todayDate: now.toISOString().slice(0, 10),
      currentTime: now.toTimeString().slice(0, 5),
      appointments: {
        total: totalAppointments,
        upcoming: upcomingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
      medications: {
        total: totalMedications,
        takenToday,
        pendingToday,
        missedToday,
        skippedToday,
      },
      compliancePercentage,
      unreadNotifications,
      recentActivitiesCount,
    })
  );
});

/**
 * Get dashboard card statistics dataset
 * GET /api/dashboard/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalAppointments,
    upcomingAppointments,
    completedAppointments,
    totalMedications,
    takenToday,
    missedToday,
    skippedToday,
    totalReports,
    aiSummariesCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: { userId } }),
    prisma.appointment.count({ where: { userId, status: "Upcoming" } }),
    prisma.appointment.count({ where: { userId, status: "Completed" } }),
    prisma.medication.count({ where: { userId } }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Taken",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Missed",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.reminderHistory.count({
      where: {
        medication: { userId },
        status: "Skipped",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.report.count({ where: { userId } }),
    prisma.aiSummary.count({ where: { appointment: { userId } } }),
  ]);

  const allLogs = await prisma.reminderHistory.findMany({
    where: { medication: { userId } },
  });
  const totalLogs = allLogs.length;
  const takenLogs = allLogs.filter((l) => l.status === "Taken").length;
  const compliancePercentage = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  const pendingToday = Math.max(0, totalMedications - (takenToday + missedToday + skippedToday));

  res.status(200).json(
    successResponse("Dashboard statistics loaded", {
      cards: [
        { title: "Total Appointments", value: totalAppointments, type: "appointments" },
        { title: "Upcoming Appointments", value: upcomingAppointments, type: "upcoming" },
        { title: "Completed Appointments", value: completedAppointments, type: "completed" },
        { title: "Total Medications", value: totalMedications, type: "medications" },
        { title: "Taken Today", value: takenToday, type: "taken" },
        { title: "Pending Today", value: pendingToday, type: "pending" },
        { title: "Missed Today", value: missedToday, type: "missed" },
        { title: "Medication Compliance", value: `${compliancePercentage}%`, type: "compliance" },
        { title: "Total Reports", value: totalReports, type: "reports" },
        { title: "AI Medical Summaries", value: aiSummariesCount, type: "ai" },
      ],
    })
  );
});

/**
 * Get dashboard charts datasets
 * GET /api/dashboard/charts
 */
export const getChartsData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Appointments per month mock/dynamic datasets
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    select: { appointmentDate: true },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCounts = monthNames.map((name) => ({ month: name, count: 0 }));

  appointments.forEach((appt) => {
    const monthIndex = new Date(appt.appointmentDate).getMonth();
    monthlyCounts[monthIndex].count += 1;
  });

  // 2. Medication status distribution
  const allLogs = await prisma.reminderHistory.findMany({
    where: { medication: { userId } },
    select: { status: true },
  });

  const statusDistribution = {
    Taken: allLogs.filter((l) => l.status === "Taken").length,
    Missed: allLogs.filter((l) => l.status === "Missed").length,
    Skipped: allLogs.filter((l) => l.status === "Skipped").length,
  };

  // 3. Weekly Appointments (Sun-Sat)
  const weeklyCounts = [
    { day: "Sun", count: 0 },
    { day: "Mon", count: 0 },
    { day: "Tue", count: 0 },
    { day: "Wed", count: 0 },
    { day: "Thu", count: 0 },
    { day: "Fri", count: 0 },
    { day: "Sat", count: 0 },
  ];

  appointments.forEach((appt) => {
    const dayIndex = new Date(appt.appointmentDate).getDay();
    weeklyCounts[dayIndex].count += 1;
  });

  res.status(200).json(
    successResponse("Charts data loaded successfully", {
      appointmentsPerMonth: monthlyCounts,
      appointmentsPerWeek: weeklyCounts,
      medicationStatusDistribution: statusDistribution,
      medicationComplianceTrend: [
        { label: "Week 1", compliance: 85 },
        { label: "Week 2", compliance: 90 },
        { label: "Week 3", compliance: 88 },
        { label: "Week 4", compliance: statusDistribution.Taken > 0 ? Math.round((statusDistribution.Taken / (statusDistribution.Taken + statusDistribution.Missed + statusDistribution.Skipped || 1)) * 100) : 100 },
      ],
      healthOverview: {
        weightTrend: [
          { date: "May 10", weight: 72 },
          { date: "May 24", weight: 71 },
          { date: "Jun 10", weight: 70.5 },
          { date: "Jun 24", weight: 70 },
        ],
      },
    })
  );
});

/**
 * Get recent activity logs
 * GET /api/dashboard/recent-activity
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activities = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  res.status(200).json(
    successResponse("Recent activities loaded", activities)
  );
});

/**
 * Get upcoming appointments (limit to 5)
 * GET /api/dashboard/upcoming-appointments
 */
export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      status: "Upcoming",
      appointmentDate: { gte: new Date() },
    },
    orderBy: { appointmentDate: "asc" },
    take: 5,
  });

  res.status(200).json(
    successResponse("Upcoming appointments loaded", appointments)
  );
});

/**
 * Get today's scheduled medications
 * GET /api/dashboard/today-medications
 */
export const getTodayMedications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Find medications scheduled for today (current date falls between start/end dates)
  const medications = await prisma.medication.findMany({
    where: {
      userId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  // Attach individual medication compliance
  const medicationsWithCompliance = await Promise.all(
    medications.map(async (med) => {
      const logs = await prisma.reminderHistory.findMany({
        where: { medicationId: med.id },
      });
      const total = logs.length;
      const taken = logs.filter((l) => l.status === "Taken").length;
      const compliance = total > 0 ? Math.round((taken / total) * 100) : 100;
      return {
        id: med.id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        reminderTime: med.reminderTime,
        status: med.status,
        compliance,
      };
    })
  );

  res.status(200).json(
    successResponse("Today's medications loaded", medicationsWithCompliance)
  );
});

/**
 * Get overall medication compliance analytics
 * GET /api/dashboard/compliance
 */
export const getCompliance = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const allLogs = await prisma.reminderHistory.findMany({
    where: { medication: { userId } },
    select: { status: true, createdAt: true },
  });

  const total = allLogs.length;
  const taken = allLogs.filter((l) => l.status === "Taken").length;
  const missed = allLogs.filter((l) => l.status === "Missed").length;
  const skipped = allLogs.filter((l) => l.status === "Skipped").length;
  const compliance = total > 0 ? Math.round((taken / total) * 100) : 100;

  res.status(200).json(
    successResponse("Medication compliance metrics", {
      complianceRate: compliance,
      breakdown: {
        totalReminders: total,
        takenCount: taken,
        missedCount: missed,
        skippedCount: skipped,
      },
    })
  );
});

/**
 * Get unread count and latest 5 unread notifications
 * GET /api/dashboard/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  res.status(200).json(
    successResponse("Unread notifications summary", {
      unreadCount,
      latestNotifications: notifications,
    })
  );
});

/**
 * Get appointments grouped by date for Calendar Preview
 * GET /api/dashboard/calendar-preview
 */
export const getCalendarPreview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { appointmentDate: "asc" },
  });

  const grouped = appointments.reduce((acc, appt) => {
    const dateStr = appt.appointmentDate.toISOString().slice(0, 10);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(appt);
    return acc;
  }, {});

  res.status(200).json(
    successResponse("Calendar previews grouped by date", grouped)
  );
});

/**
 * Global dashboard search across modules
 * GET /api/dashboard/search
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q } = req.query;

  if (!q) {
    throw new BadRequestError("Search query string (q) is required.");
  }

  const [appointments, medications, activities, reports, aiSummaries] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId,
        OR: [
          { doctorName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { hospital: { contains: q, mode: "insensitive" } },
          { specialization: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.medication.findMany({
      where: {
        userId,
        OR: [
          { medicineName: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.activityLog.findMany({
      where: {
        userId,
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { module: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.report.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.aiSummary.findMany({
      where: {
        appointment: { userId },
        OR: [
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
  ]);

  res.status(200).json(
    successResponse("Global dashboard search results", {
      appointments,
      medications,
      activities,
      reports,
      aiSummaries,
    })
  );
});
