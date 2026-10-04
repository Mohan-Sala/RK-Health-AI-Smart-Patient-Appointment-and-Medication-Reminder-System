import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";

/**
 * Generates a clean, patient-friendly PDF report
 */
export const generatePdfFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Branding Title
      doc.fontSize(26).fillColor("#0F172A").text("RK Health Companion", { align: "center" });
      doc.fontSize(10).fillColor("#64748B").text("Personalized Medical & Compliance Report", { align: "center" });
      doc.moveDown(1.5);

      // Horizontal Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#E2E8F0");
      doc.moveDown(1.5);

      // Patient Info Section
      doc.fontSize(16).fillColor("#1E293B").text("Patient Overview", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#334155");
      doc.text(`• Full Name: ${data.patient.fullName}`);
      doc.text(`• Email Address: ${data.patient.email}`);
      doc.text(`• Phone Contact: ${data.patient.phone || "Not specified"}`);
      doc.text(`• Blood Group: ${data.patient.bloodGroup || "Not specified"}`);
      doc.text(`• Allergies: ${data.patient.allergies || "None declared"}`);
      doc.text(`• Medical Conditions: ${data.patient.medicalConditions || "None declared"}`);
      doc.moveDown(1.5);

      // Appointments Section
      doc.fontSize(16).fillColor("#1E293B").text("Scheduled Appointments", { underline: true });
      doc.moveDown(0.5);
      if (data.appointments.length === 0) {
        doc.fontSize(11).fillColor("#64748B").text("No appointments recorded.");
      } else {
        data.appointments.forEach((appt, idx) => {
          doc.fontSize(11).fillColor("#334155").text(
            `${idx + 1}. ${appt.title} with ${appt.doctorName} (${appt.specialization || "General"})`
          );
          doc.fontSize(10).fillColor("#64748B").text(
            `   Date: ${new Date(appt.appointmentDate).toISOString().slice(0, 10)} | Time: ${appt.appointmentTime} | Status: ${appt.status} at ${appt.hospital || "Clinic"}`
          );
          doc.moveDown(0.25);
        });
      }
      doc.moveDown(1.5);

      // Medications Section
      doc.fontSize(16).fillColor("#1E293B").text("Medications & Prescriptions", { underline: true });
      doc.moveDown(0.5);
      if (data.medications.length === 0) {
        doc.fontSize(11).fillColor("#64748B").text("No medications recorded.");
      } else {
        data.medications.forEach((med, idx) => {
          doc.fontSize(11).fillColor("#334155").text(
            `${idx + 1}. ${med.medicineName} (${med.dosage} - ${med.strength || "N/A"})`
          );
          doc.fontSize(10).fillColor("#64748B").text(
            `   Scheduled: ${med.reminderTime} | Food: ${med.foodPreference || "N/A"} | Compliance: ${med.compliance}%`
          );
          doc.moveDown(0.25);
        });
      }
      doc.moveDown(1.5);

      // Footer
      doc.fontSize(8).fillColor("#94A3B8").text(
        `Report generated automatically on ${new Date().toLocaleString()} by RK Health Companion. Page 1 of 1`,
        { align: "center", valign: "bottom" }
      );

      doc.end();
      stream.on("finish", () => resolve(true));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates an Excel report with multiple spreadsheets
 */
export const generateExcelFile = async (filePath, data) => {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Appointments
  const apptSheet = workbook.addWorksheet("Appointments");
  apptSheet.columns = [
    { header: "Doctor Name", key: "doctorName", width: 25 },
    { header: "Title", key: "title", width: 25 },
    { header: "Hospital", key: "hospital", width: 25 },
    { header: "Appointment Date", key: "appointmentDate", width: 20 },
    { header: "Time", key: "appointmentTime", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];
  data.appointments.forEach((appt) => {
    apptSheet.addRow({
      doctorName: appt.doctorName,
      title: appt.title,
      hospital: appt.hospital,
      appointmentDate: new Date(appt.appointmentDate).toISOString().slice(0, 10),
      appointmentTime: appt.appointmentTime,
      status: appt.status,
    });
  });

  // Sheet 2: Medications
  const medSheet = workbook.addWorksheet("Medications");
  medSheet.columns = [
    { header: "Medicine Name", key: "medicineName", width: 25 },
    { header: "Dosage", key: "dosage", width: 15 },
    { header: "Strength", key: "strength", width: 12 },
    { header: "Reminder Time", key: "reminderTime", width: 15 },
    { header: "Status", key: "status", width: 12 },
    { header: "Compliance Rate", key: "compliance", width: 18 },
  ];
  data.medications.forEach((med) => {
    medSheet.addRow({
      medicineName: med.medicineName,
      dosage: med.dosage,
      strength: med.strength,
      reminderTime: med.reminderTime,
      status: med.status,
      compliance: `${med.compliance}%`,
    });
  });

  // Sheet 3: Activities
  const actSheet = workbook.addWorksheet("Activity Logs");
  actSheet.columns = [
    { header: "Timestamp", key: "createdAt", width: 22 },
    { header: "Module", key: "module", width: 15 },
    { header: "Action", key: "action", width: 18 },
    { header: "Description", key: "description", width: 45 },
  ];
  data.activities.forEach((act) => {
    actSheet.addRow({
      createdAt: new Date(act.createdAt).toLocaleString(),
      module: act.module,
      action: act.action,
      description: act.description,
    });
  });

  await workbook.xlsx.writeFile(filePath);
};

/**
 * Generates flat-file CSV reports
 */
export const generateCsvFile = (filePath, data) => {
  const rows = [];
  rows.push("Section,Name/Title,Detail,Date/Status");

  data.appointments.forEach((appt) => {
    rows.push(`Appointment,"${appt.title}","${appt.doctorName}",${appt.status}`);
  });

  data.medications.forEach((med) => {
    rows.push(`Medication,"${med.medicineName}","${med.dosage}",${med.status}`);
  });

  data.activities.forEach((act) => {
    rows.push(`Activity,"${act.action}","${act.description}",${new Date(act.createdAt).toISOString().slice(0, 10)}`);
  });

  fs.writeFileSync(filePath, rows.join("\n"), "utf-8");
};
