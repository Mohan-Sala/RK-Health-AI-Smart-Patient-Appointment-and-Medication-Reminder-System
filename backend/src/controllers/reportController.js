import fs from "fs";
import path from "path";
import { prisma } from "../config/database.js";
import { generatePdfFile, generateExcelFile, generateCsvFile } from "../services/reportService.js";
import { createNotification } from "../services/notificationService.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const reportsDir = "uploads/reports";
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate a new comprehensive health report record
 * POST /api/reports/generate
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { title, reportType = "PDF" } = req.body;
  const userId = req.user.id;

  if (!title) {
    throw new BadRequestError("Report title is required.");
  }

  // 1. Gather all compilation details
  const [appointments, rawMedications, activities, aiSummaries] = await Promise.all([
    prisma.appointment.findMany({ where: { userId } }),
    prisma.medication.findMany({ where: { userId } }),
    prisma.activityLog.findMany({ where: { userId }, take: 20, orderBy: { createdAt: "desc" } }),
    prisma.aiSummary.findMany({ where: { appointment: { userId } } }),
  ]);

  const medications = await Promise.all(
    rawMedications.map(async (med) => {
      const logs = await prisma.reminderHistory.findMany({ where: { medicationId: med.id } });
      const totalLogs = logs.length;
      const takenLogs = logs.filter((l) => l.status === "Taken").length;
      const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;
      return { ...med, compliance };
    })
  );

  const reportData = {
    patient: req.user,
    appointments,
    medications,
    activities,
    aiSummaries,
  };

  // 2. Setup folder filepaths
  const reportId = crypto.randomUUID();
  const fileExt = reportType.toLowerCase();
  const filename = `report-${reportId}.${fileExt}`;
  const filePath = path.join(reportsDir, filename);

  // 3. Write physical document on disk
  if (reportType === "PDF") {
    await generatePdfFile(filePath, reportData);
  } else if (reportType === "Excel") {
    await generateExcelFile(filePath, reportData);
  } else if (reportType === "CSV") {
    generateCsvFile(filePath, reportData);
  } else {
    throw new BadRequestError(`Unsupported report format: ${reportType}`);
  }

  // 4. Save to database
  const report = await prisma.report.create({
    data: {
      userId,
      title,
      reportType,
      reportPath: `/uploads/reports/${filename}`,
    },
  });

  // 5. Generate notification
  await createNotification(
    userId,
    "Report Generated",
    `A new ${reportType} health report "${title}" has been successfully compiled.`,
    "Report"
  );

  // 6. Log activity audit
  await prisma.activityLog.create({
    data: {
      userId,
      module: "Report",
      action: "REPORT_GENERATE",
      description: `Generated ${reportType} health report: "${title}".`,
    },
  });

  res.status(201).json(
    successResponse("Report generated successfully", report, 201)
  );
});

/**
 * Get all health reports for user
 * GET /api/reports
 */
export const getReports = asyncHandler(async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(
    successResponse("Reports retrieved successfully", reports)
  );
});

/**
 * Get detailed report info by ID
 * GET /api/reports/:id
 */
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report || report.userId !== req.user.id) {
    throw new NotFoundError("Report not found.");
  }

  res.status(200).json(
    successResponse("Report details retrieved", report)
  );
});

/**
 * Download report as PDF stream
 * GET /api/reports/:id/pdf
 */
export const downloadPdfReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== req.user.id) {
    throw new NotFoundError("Report not found.");
  }

  const absolutePath = path.resolve(report.reportPath.replace(/^\//, ""));
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError("Physical report file not found on disk.");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="report-${id}.pdf"`);
  fs.createReadStream(absolutePath).pipe(res);
});

/**
 * Download report as Excel stream
 * GET /api/reports/:id/excel
 */
export const downloadExcelReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== req.user.id) {
    throw new NotFoundError("Report not found.");
  }

  // Ensure file is Excel
  if (report.reportType !== "Excel") {
    // Generate dynamically if format mismatch
    const absolutePath = path.resolve(report.reportPath.replace(/^\//, ""));
    const folder = path.dirname(absolutePath);
    const filename = path.basename(absolutePath).replace(/\.\w+$/, ".excel");
    const newPath = path.join(folder, filename);

    // Regenerate to Excel
    const [appointments, rawMedications, activities, aiSummaries] = await Promise.all([
      prisma.appointment.findMany({ where: { userId: req.user.id } }),
      prisma.medication.findMany({ where: { userId: req.user.id } }),
      prisma.activityLog.findMany({ where: { userId: req.user.id }, take: 20, orderBy: { createdAt: "desc" } }),
      prisma.aiSummary.findMany({ where: { appointment: { userId: req.user.id } } }),
    ]);
    const medications = await Promise.all(
      rawMedications.map(async (med) => {
        const logs = await prisma.reminderHistory.findMany({ where: { medicationId: med.id } });
        const totalLogs = logs.length;
        const takenLogs = logs.filter((l) => l.status === "Taken").length;
        const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;
        return { ...med, compliance };
      })
    );
    await generateExcelFile(newPath, { patient: req.user, appointments, medications, activities, aiSummaries });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="report-${id}.xlsx"`);
    return fs.createReadStream(newPath).pipe(res);
  }

  const absolutePath = path.resolve(report.reportPath.replace(/^\//, ""));
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError("Physical report file not found on disk.");
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="report-${id}.xlsx"`);
  fs.createReadStream(absolutePath).pipe(res);
});

/**
 * Download report as CSV stream
 * GET /api/reports/:id/csv
 */
export const downloadCsvReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== req.user.id) {
    throw new NotFoundError("Report not found.");
  }

  // Ensure file is CSV
  if (report.reportType !== "CSV") {
    // Generate dynamically if format mismatch
    const absolutePath = path.resolve(report.reportPath.replace(/^\//, ""));
    const folder = path.dirname(absolutePath);
    const filename = path.basename(absolutePath).replace(/\.\w+$/, ".csv");
    const newPath = path.join(folder, filename);

    const [appointments, rawMedications, activities, aiSummaries] = await Promise.all([
      prisma.appointment.findMany({ where: { userId: req.user.id } }),
      prisma.medication.findMany({ where: { userId: req.user.id } }),
      prisma.activityLog.findMany({ where: { userId: req.user.id }, take: 20, orderBy: { createdAt: "desc" } }),
      prisma.aiSummary.findMany({ where: { appointment: { userId: req.user.id } } }),
    ]);
    const medications = await Promise.all(
      rawMedications.map(async (med) => {
        const logs = await prisma.reminderHistory.findMany({ where: { medicationId: med.id } });
        const totalLogs = logs.length;
        const takenLogs = logs.filter((l) => l.status === "Taken").length;
        const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;
        return { ...med, compliance };
      })
    );
    generateCsvFile(newPath, { patient: req.user, appointments, medications, activities, aiSummaries });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="report-${id}.csv"`);
    return fs.createReadStream(newPath).pipe(res);
  }

  const absolutePath = path.resolve(report.reportPath.replace(/^\//, ""));
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError("Physical report file not found on disk.");
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="report-${id}.csv"`);
  fs.createReadStream(absolutePath).pipe(res);
});

/**
 * Delete a report
 * DELETE /api/reports/:id
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.report.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new NotFoundError("Report not found.");
  }

  // Remove the physical file if it exists
  const absolutePath = path.resolve(existing.reportPath.replace(/^\//, ""));
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      // Log error but proceed
    }
  }

  // Delete from database
  await prisma.report.delete({
    where: { id },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Report",
      action: "REPORT_DELETE",
      description: `Deleted health report: "${existing.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Report deleted successfully")
  );
});
