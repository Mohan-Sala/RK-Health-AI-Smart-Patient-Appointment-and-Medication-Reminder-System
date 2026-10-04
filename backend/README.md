# RK Health Backend

This repository holds the backend foundation and database architecture for RK Health — an AI-powered Healthcare Management and Patient Reminder Platform.

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster connection URI

### Step 1: Install Dependencies
Navigate to the `backend` folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your MongoDB Atlas connection string:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` in `.env` is set to your MongoDB Atlas connection string:
```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rk_health?retryWrites=true&w=majority"
```

---

## 🛠️ Database Setup (MongoDB Atlas)

### 1. Configure MongoDB Atlas Connection
1. In your MongoDB Atlas Dashboard, go to **Database Deployments**.
2. Click **Connect** > **Drivers** (Node.js).
3. Copy your connection string and paste it as `DATABASE_URL` in `.env`.
4. Ensure your current IP is whitelisted in **Network Access** (`0.0.0.0/0` or your current IP).

### 2. Push Schema to MongoDB
Run the Prisma command to create all collections and indexes in your MongoDB database:
```bash
npx prisma db push
```

### 3. Generate Prisma Client
Generate the Prisma Client optimized for MongoDB:
```bash
npx prisma generate
```

### 4. Seed Database (Optional)
Seeding inserts mock data (User, Appointments, Medications, AI Summaries, Reports, Notifications, Activity Logs, and Reminder History):
```bash
npx prisma db seed
```

---

## 📊 Database Schema Overview

```
                   ┌──────────────┐
                   │     User     │
                   └──────┬───────┘
     ┌──────────┬─────────┼─────────┬──────────┐
     ▼          ▼         ▼         ▼          ▼
┌─────────┐┌─────────┐┌───────┐┌─────────┐┌───────────┐
│ Appoint ││ Meds    ││Reports││ Notifications ││ActivityLogs│
└────┬────┘└────┬────┘└───────┘└─────────┘└───────────┘
     ▼          ▼
┌─────────┐┌───────────────┐
│ AISummary││ReminderHistory│
└─────────┘└───────────────┘
```

### Core Collections:
1. **User**: Credentials, profiles, medical vitals, and system role configuration.
2. **Appointment**: Tracks patient appointments, times, doctors, visits, and links to AI summaries and calendars.
3. **Medication**: Holds drug names, dosages, frequencies, reminders, and recipient phone numbers.
4. **AiSummary**: Stores AI-generated analysis notes attached to appointments.
5. **Report**: Contains user files upload paths and documents metadata.
6. **Notification**: Dispatches system, appointment, report, and reminder alerts to users.
7. **ActivityLog**: Logs platform interactions and actions for audit logs.
8. **ReminderHistory**: Audits Twilio/SMS, Email, and Push reminder deliveries.

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/       # Environment, MongoDB connection helper, and logging configs
│   ├── controllers/  # Route controllers
│   ├── routes/       # API router mappings
│   ├── middleware/   # Rate limiting, auth, logging, and error wrappers
│   ├── services/     # Third-party wrappers (Groq AI, Twilio, Google Calendar)
│   ├── prisma/       # schema.prisma & seed.js MongoDB schema scripts
│   ├── validators/   # Zod request validation schemas
│   ├── utils/        # Error wrappers and standard formatting helpers
│   ├── jobs/         # Scheduled reminder cron jobs
│   ├── logs/         # Request and system logs
│   ├── uploads/      # Uploaded files (avatars, generated reports)
│   ├── app.js        # Express application configuration
│   └── server.js     # Entry point that runs the HTTP listener
```
