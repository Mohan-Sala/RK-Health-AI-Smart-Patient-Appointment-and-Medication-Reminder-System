import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding database...");

  // Clean existing records to avoid duplicate conflicts and clean database
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.reminderHistory.deleteMany({});
  await prisma.medication.deleteMany({});
  await prisma.aiSummary.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create a user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      fullName: "Mohan Kumar",
      email: "mohan@gmail.com",
      passwordHash,
      phone: "+91 98765 43210",
      dateOfBirth: new Date("1995-10-17T00:00:00.000Z"),
      gender: "Male",
      profileImage: "https://i.pravatar.cc/80?img=12",
      bloodGroup: null,
      height: null,
      weight: null,
      allergies: null,
      medicalConditions: null,
      insurance: null,
      bmi: null,
      emergencyContactName: "Vijay Kumar",
      emergencyContactPhone: "+91 98765 12345",
      role: "patient",
      isVerified: true,
      isActive: true,
    },
  });

  console.log(`👤 Created user: ${user.fullName} (${user.email})`);

  // 2. Create appointments
  const appt1 = await prisma.appointment.create({
    data: {
      userId: user.id,
      patientName: "Mohan Kumar",
      doctorName: "Dr. Rajesh Sharma",
      title: "Cardiology Consultation",
      hospital: "Apollo Hospital",
      specialization: "Cardiologist",
      appointmentDate: new Date("2026-05-24T09:00:00.000Z"),
      appointmentTime: "09:00",
      visitType: "Consultation",
      priority: "High",
      status: "Upcoming",
      notes: "Routine checkup for heart pressure regulation.",
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      userId: user.id,
      patientName: "Mohan Kumar",
      doctorName: "Dr. Priya Mehta",
      title: "Dermatology Checkup",
      hospital: "Fortis Clinic",
      specialization: "Dermatologist",
      appointmentDate: new Date("2026-05-25T16:30:00.000Z"),
      appointmentTime: "16:30",
      visitType: "Follow_up",
      priority: "Medium",
      status: "Upcoming",
      notes: "Follow up review of skin allergy patches.",
    },
  });

  console.log("📅 Created appointments");

  // 3. Create AI Summary
  await prisma.aiSummary.create({
    data: {
      appointmentId: appt1.id,
      summary: "Patient visited for regular heart checkup. Vitals stable, mild hypertension detected.",
      visitOverview: "BP: 135/85 mmHg. Heart rate: 72 bpm. Lungs clear.",
      medicalExplanation: "Hypertension is currently well managed. Recommend continuous monitoring.",
      medicationInstructions: "Take Paracetamol if headache persists. Do not miss blood pressure tablets.",
      followUpAdvice: "Schedule a review in 3 months or if dizziness occurs.",
      recommendations: "Reduce sodium intake, maintain regular walks.",
    },
  });

  console.log("🤖 Created AI Summary");

  // 4. Create medications
  const med1 = await prisma.medication.create({
    data: {
      userId: user.id,
      medicineName: "Paracetamol",
      dosage: "1 Tablet",
      strength: "500mg",
      medicineType: "Tablet",
      frequency: "Twice Daily",
      foodPreference: "After Food",
      startDate: new Date("2026-05-20T00:00:00.000Z"),
      endDate: new Date("2026-06-20T00:00:00.000Z"),
      reminderTime: "09:00",
      phoneNumber: "+91 98765 43210",
      reminderEnabled: true,
      status: "Pending",
      notes: "Take for body pain or headaches.",
    },
  });

  const med2 = await prisma.medication.create({
    data: {
      userId: user.id,
      medicineName: "Vitamin D3",
      dosage: "1 Capsule",
      strength: "60K IU",
      medicineType: "Capsule",
      frequency: "Once Daily",
      foodPreference: "After Food",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-08-01T00:00:00.000Z"),
      reminderTime: "13:00",
      phoneNumber: "+91 98765 43210",
      reminderEnabled: true,
      status: "Taken",
      notes: "Prescribed weekly dietary supplement.",
    },
  });

  console.log("💊 Created medications");

  // 5. Create Reminder History
  await prisma.reminderHistory.create({
    data: {
      medicationId: med1.id,
      reminderType: "SMS",
      status: "Sent",
      deliveryProvider: "Twilio",
      deliveryTime: new Date(),
      response: "Delivered successfully. Message SID: SMxxx",
    },
  });

  console.log("⏰ Created reminder history");

  // 6. Create Reports
  await prisma.report.create({
    data: {
      userId: user.id,
      title: "Cardiac Examination Record",
      reportType: "Diagnostic",
      reportPath: "uploads/reports/cardiac_report.pdf",
    },
  });

  console.log("📄 Created reports");

  // 7. Create Notifications
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Appointment Booked",
      message: "Your appointment with Dr. Rajesh Sharma has been booked successfully for May 24.",
      type: "Appointment",
      isRead: false,
    },
  });

  console.log("🔔 Created notifications");

  // 8. Create Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      module: "Auth",
      action: "LOGIN",
      description: "User logged in from Google Chrome, Windows 11",
      ipAddress: "192.168.1.1",
      device: "Windows Desktop",
    },
  });

  console.log("📝 Created activity logs");
  console.log("🌱 Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
