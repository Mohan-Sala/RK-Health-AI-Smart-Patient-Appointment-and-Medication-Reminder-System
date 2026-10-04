# RK Health — AI-Powered Smart Patient Appointment & Medication Reminder System

An intelligent, full-stack healthcare platform engineered to streamline clinical consultations, automated medication adherence, doctor-patient appointment lifecycle, and AI-driven clinical summaries.

---

## 🌟 Key Features

### 👨‍⚕️ Doctor Portal
- **Clinical Overview & OPD Dashboard**: Real-time stats on appointments, active patient count, disease-specific prescriptions, and OPD availability status.
- **Smart Appointment Management**: Reschedule consultations with custom clinical rationales and automated notifications.
- **Disease-Specific Prescribing & Dosage Titration**: Prescribe medications tied to diagnosed conditions (e.g., Hypertension, Diabetes) and dynamically adjust/taper doses based on clinical recovery.
- **AI Consultation Summaries**: Generate targeted doctor-facing clinical summaries for consultations, extracting key findings, diagnoses, and follow-up plans.

### 🧑‍💼 Patient Portal
- **Personalized Health Dashboard**: Upcoming consultations, daily medicine timeline (Morning, Afternoon, Evening, Night), and adherence tracking.
- **SMS Reminders via Twilio**: Automated carrier SMS reminders for prescribed medications and upcoming appointments dispatched directly to mobile phones.
- **Google Calendar Synchronization**: One-click Google Calendar integration for instant calendar scheduling and reminder synchronization.
- **Dynamic Profile & Vitals**: Track blood group, height, weight, BMI, allergies, medical conditions, and lifestyle with full dynamic statistics.
- **Patient-Centric AI Summaries**: Layman-friendly explanations of consultations, medications, and lifestyle guidance.

---

## 🛠️ Architecture & Tech Stack

### **Frontend**
- **Framework**: React 19, TypeScript, Vite
- **Routing**: TanStack Router & TanStack Start
- **Styling**: Tailwind CSS, Lucide Icons, Radix UI primitives
- **Notifications**: Sonner

### **Backend**
- **Runtime**: Node.js (ES Modules), Express.js
- **Database & ORM**: MongoDB Atlas, Prisma ORM
- **Authentication**: JWT (JSON Web Tokens), Bcrypt password hashing
- **Validation**: Zod schema validation
- **Scheduling**: Node-Cron background schedulers for automated reminders
- **SMS Gateway**: Twilio REST API integration
- **Calendar Integration**: Google Calendar API (OAuth 2.0)
- **AI Intelligence**: Groq Cloud SDK (Llama 3 70B) for clinical summaries

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Mohan-Sala/RK-Health-AI-Smart-Patient-Appointment-and-Medication-Reminder-System.git
cd RK-Health-AI-Smart-Patient-Appointment-and-Medication-Reminder-System
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Fill in your configuration:
- `DATABASE_URL`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for authentication
- `GROQ_API_KEY`: API key from [Groq Console](https://console.groq.com)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Twilio credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials

Push the database schema:
```bash
npx prisma db push
npx prisma generate
```

Start the backend server:
```bash
npm run dev
```
The backend API runs on `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend application runs on `http://localhost:3000`.

---

## 📂 Project Structure

```
RK-Health/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, logger, and environment configs
│   │   ├── controllers/     # Route business logic (auth, appointments, meds, ai, sms)
│   │   ├── jobs/            # Node-cron reminder schedulers
│   │   ├── middleware/      # Auth protection, file uploads, validation
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # Twilio, Google Calendar, Groq AI, and report services
│   │   └── validators/      # Zod request validation schemas
│   ├── prisma/              # Prisma schema definition
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, layout, and modals
│   │   ├── routes/          # TanStack file-based application routes
│   │   ├── lib/             # API clients, store management, and utilities
│   │   └── index.css        # Tailwind style definitions
│   └── package.json
└── README.md
```

---

## 🔒 Security & Best Practices
- Passwords hashed using bcrypt with 12 salt rounds.
- Protected endpoints authenticated using JWT bearer tokens.
- Strict input validation via Zod middleware.
- Secrets and API keys isolated in `.env` (excluded from version control via `.gitignore`).
- E.164 international phone number standardization.
