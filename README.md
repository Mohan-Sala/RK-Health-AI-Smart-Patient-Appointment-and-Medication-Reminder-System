# 🏥 RK Health - AI-Powered Smart Patient Appointment & Medication Reminder System

<div align="center">

**An AI-Powered Healthcare Management Platform for Smart Patient Care**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?logo=mongodb&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-AI-blueviolet)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![Twilio](https://img.shields.io/badge/Twilio-SMS-red)
![Google Calendar](https://img.shields.io/badge/Google-Calendar-4285F4?logo=googlecalendar&logoColor=white)

</div>

---

# 📖 Overview

RK Health is an **AI-powered healthcare management platform** that enables patients and doctors to manage appointments, medication schedules, AI-generated clinical summaries, healthcare reports, and personal health records from a single responsive dashboard.

The platform combines cloud database technologies, Artificial Intelligence, secure authentication, automated SMS gateways, and modern web development practices to simplify healthcare management for patients and clinicians alike.

---

# ✨ Key Features

* 👤 **Secure User Registration & Login** (Role-based Patient & Doctor access)
* 🔐 **JWT-Based Authentication** with bcrypt password hashing
* 📅 **Appointment Management** with Doctor Availability & Reschedule workflows
* 💊 **Medication & Prescription Tracking** with Disease-specific dosage titration
* 🤖 **AI-Powered Health Summaries** (Powered by Groq LLaMA 3.3-70B)
* 📊 **Interactive Dashboard Analytics** (Medicine timeline, compliance rates, OPD hours)
* 📈 **Medication Compliance Tracking** (Morning, Afternoon, Evening, Night schedules)
* 📄 **Health Report Generation** (Downloadable PDF, CSV, and Excel exports)
* 🔔 **In-App Notification Center** with real-time audio alerts
* 📱 **Automated Twilio SMS Alerts** directly to mobile phones
* 📆 **Google Calendar Integration** for seamless appointment synchronization
* 📜 **Activity Logs & Audit Trails**
* 👨‍⚕️ **Dynamic Doctor Clinical Management**
* 👤 **Comprehensive Health Profile Management** (BMI calculator, blood group, vitals)
* 🌙 **Dark / Light Theme Modes**
* 📱 **Fully Responsive UI** across mobile, tablet, and desktop
* ☁️ **Cloud Database Integration** (MongoDB Atlas & Prisma ORM)
* 🔒 **Secure API Architecture** with Zod schema validation & rate limiting

---

# 🏗️ System Architecture

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
                       │
                       ▼
         Node.js + Express.js REST API
                       │
                       ▼
          JWT Authentication Middleware
                       │
                       ▼
                  Prisma ORM
                       │
                       ▼
             MongoDB Atlas Database
                       │
                       ├──────────────► Groq AI (LLaMA 3.3 70B)
                       │
                       ├──────────────► Twilio SMS Gateway
                       │
                       └──────────────► Google Calendar OAuth API
```

---

# 🛠 Technology Stack

## Frontend

* **Library**: React 19
* **Language**: TypeScript
* **Routing**: TanStack Router & TanStack Start
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Build Tool**: Vite

## Backend

* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Validation**: Zod
* **Task Scheduling**: Node-Cron (Automated reminder workers)
* **Logging**: Winston & Morgan

## Database & ORM

* **Database**: MongoDB Atlas (Cloud Database)
* **ORM**: Prisma ORM

## Authentication & Security

* **Auth**: JSON Web Tokens (JWT)
* **Encryption**: bcrypt (12 salt rounds)
* **Security**: Helmet, CORS, Express Rate Limit

## AI Intelligence

* **Provider**: Groq Cloud SDK
* **Model**: LLaMA 3.3 70B Versatile

## External Integrations

* **SMS Notifications**: Twilio REST API
* **Calendar Sync**: Google Calendar API (OAuth 2.0)

---

# 📂 Project Structure

```
RK-Health/
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, layout, and modals
│   │   ├── routes/          # TanStack file-based application routes
│   │   ├── lib/             # API client, store management, and utilities
│   │   └── styles.css       # Tailwind CSS theme styling
│   ├── public/              # Static assets and icons
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/          # Database, logger, and environment configs
│   │   ├── controllers/     # Route business logic (auth, appointments, meds, ai, sms)
│   │   ├── jobs/            # Node-cron background reminder schedulers
│   │   ├── middleware/      # Auth protection, file uploads, validation
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # Twilio, Google Calendar, Groq AI, and report services
│   │   ├── utils/           # Helper functions, custom errors, response wrappers
│   │   └── validators/      # Zod request validation schemas
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma schema definitions
│   │   └── seed.js          # Database seed scripts
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

# 🚀 Main Modules

## 1. Authentication
* User Registration (Patient & Doctor accounts)
* User Login with secure credential verification
* JWT Token generation and verification
* Protected API routes & auto-logout on token expiration

## 2. Dashboard
* Healthcare statistics & quick status cards
* Upcoming appointments feed
* Today's medication timeline (Morning, Afternoon, Evening, Night)
* Doctor clinical practice overview & OPD status pill
* One-click quick action buttons

## 3. Appointment Management
* Book consultations with preferred doctors and hospitals
* Doctor reschedule modal with clinical reasoning
* Add appointments directly to Google Calendar
* Dispatch SMS reminders for scheduled visits
* Status tracking: Upcoming, Completed, Cancelled

## 4. Medication Management
* Add prescriptions with dosage, frequency, and duration
* Disease-specific medication assignment (Hypertension, Diabetes, etc.)
* Doctor Dosage Titration: adjust or taper doses based on patient improvement
* Compliance tracking: Mark doses as Taken or Skipped
* Automated SMS reminders via Twilio

## 5. AI Consultation Summary
Generate targeted clinical & patient summaries using:
* Chief Complaints & Symptoms
* Vital Signs & Test Results
* Diagnosis & Clinical Assessment
* Prescriptions & Lifestyle Guidance
* Follow-up instructions

*Powered by **Groq LLaMA 3.3 70B Versatile**.*

## 6. Reports & Analytics
Generate comprehensive health summaries including:
* Appointment History
* Medication Adherence History
* AI Consultation Summaries
* Health Records & Vitals
* **Export Formats**: PDF, CSV, and Excel

## 7. Profile & Health Vitals
* Personal contact information
* Health profile: Blood Group, Height, Weight, BMI Calculator
* Allergies, chronic medical conditions, and insurance provider
* Doctor clinical practice profile (Specialization, Hospital, OPD hours)

## 8. Activity Logs
* Detailed audit logging for all account events
* Login history and security events
* Medication and appointment lifecycle actions
* SMS delivery status tracking

---

# 🔒 Security Features

* JWT Authentication with strict expiration
* Password Hashing using bcrypt with 12 salt rounds
* Strict Input Validation via Zod middleware
* Sensitive credentials isolated in `.env` (excluded by `.gitignore`)
* MongoDB injection protection via Prisma ORM
* Rate limiting against brute-force attacks
* International E.164 phone number normalization

---

# 🤖 AI Integration

RK Health leverages **Groq LLaMA 3.3-70B Versatile** for:
* **Doctor Clinical Summaries**: Detailed, structured clinical SOAP notes for medical records.
* **Patient-Friendly Insights**: Clear explanations of diagnoses, side effects, and dietary guidelines.
* **Follow-up Recommendations**: Intelligent post-consultation care plans.

---

# 🗄 Database

The application uses **MongoDB Atlas** managed through **Prisma ORM**.

### Main Collections:
* `User` (Patients and Doctors)
* `Appointment` (Scheduled consultations & Google Calendar sync)
* `Medication` (Prescriptions, titration histories, reminder schedules)
* `AISummary` (Groq-generated clinical notes)
* `Report` (Generated medical records)
* `Notification` (In-app alerts)
* `ActivityLog` (Security and operational audit trails)
* `ReminderHistory` (Twilio SMS delivery tracking logs)

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/Mohan-Sala/RK-Health-AI-Smart-Patient-Appointment-and-Medication-Reminder-System.git
cd RK-Health-AI-Smart-Patient-Appointment-and-Medication-Reminder-System
```

---

## 2. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000

# MongoDB Atlas Connection URL
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rk_health?retryWrites=true&w=majority"

# JWT Authentication
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=12

# Groq Cloud AI
GROQ_API_KEY="gsk_your_groq_api_key"

# Twilio SMS Alerts
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1XXXXXXXXXX"

# Google Calendar OAuth Integration
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/calendar/callback"
```

---

# 🗄 Database Setup (Prisma)

Navigate to the `backend/` folder:

### 1. Push Schema to MongoDB Atlas
```bash
npx prisma db push
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

---

# ▶ Run the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
> Server runs on `http://localhost:5000`

### Start Frontend Application
In a new terminal:
```bash
cd frontend
npm run dev
```
> Application runs on `http://localhost:3000`

---

# 📷 Application Pages

| Module | Features |
|---|---|
| **Landing Page** | Platform overview, healthcare service highlights, dynamic hero section |
| **Authentication** | Secure sign-in & registration with role selection (Patient / Doctor) |
| **Dashboard** | Real-time health statistics, medication schedule timeline, OPD status |
| **Appointments** | Consultation scheduling, doctor rescheduling, Google Calendar sync |
| **Medications** | Prescriptions, disease-specific dosages, compliance tracking, SMS reminders |
| **AI Summary** | Groq LLaMA 3.3-70B consultation summaries for doctors and patients |
| **Reports** | Medical report generation with exports to PDF, CSV, and Excel |
| **Profile** | Health information, BMI calculation, blood group, doctor clinical details |

---

# 🎯 Future Enhancements

* 📱 Native Mobile Application (React Native / Flutter)
* 📹 Telemedicine Video Consultations (WebRTC)
* ⌚ Wearable Health Device Integration (Apple Health / Google Fit)
* 📸 OCR Prescription & Lab Report Scanner
* 🗣️ Multilingual Voice Assistant for medication reminders
* 🚨 Emergency One-Touch SOS Alert System
* 👨‍👩‍👧 Family Health Account Management
* 🔮 Predictive Early Disease Risk Assessment

---

# 📚 Documentation

Detailed documentation guides are available in the repository:
* [API Documentation](file:///D:/RK-Health/backend/README.md)
* Database Schema & Relationships
* System Architecture & Security Design
* Twilio SMS & Google Calendar Integration Guides

---

# 👨‍💻 Author

**Mohan Sala**  
Computer Science Engineering Student  
AI & Full Stack Developer  
GitHub: [@Mohan-Sala](https://github.com/Mohan-Sala)

---

# 🙏 Acknowledgements

Special thanks to the open-source community and technologies powering RK Health:
* **Groq** for high-performance LLaMA AI inference
* **Twilio** for telecommunication SMS infrastructure
* **Google Cloud** for Google Calendar API
* **Prisma** & **MongoDB Atlas** for modern cloud database tooling
* **React**, **Vite**, and **Tailwind CSS**

---

# 📄 License

This project is open-source and available under the **MIT License**.

---

<div align="center">

### ⭐ If you found this project helpful, please consider giving it a Star! ⭐

</div>
