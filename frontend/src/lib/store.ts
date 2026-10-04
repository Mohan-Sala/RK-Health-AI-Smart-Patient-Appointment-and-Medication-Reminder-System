import { useSyncExternalStore } from "react";
import { toast } from "sonner";

export type Appointment = {
  id: string;
  patient: string;
  doctor: string;
  spec: string;
  title: string;
  hospital: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  phone: string;
  email: string;
  visitType: "Consultation" | "Follow-up" | "Emergency" | "Routine Checkup";
  priority: "Low" | "Medium" | "High";
  notes: string;
  status: "Today" | "Upcoming" | "Completed" | "Cancelled";
  calendarEventId?: string | null;
  calendarLink?: string | null;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  strength: string;
  type: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops";
  frequency: "Once Daily" | "Twice Daily" | "Three Times Daily" | "Weekly" | "Monthly";
  time: string; // HH:MM
  slot: "Morning" | "Afternoon" | "Evening" | "Night";
  startDate: string;
  endDate: string;
  foodPref: "Before Food" | "After Food" | "With Food";
  phone: string;
  reminderEnabled: boolean;
  notes: string;
  status: "Pending" | "Taken" | "Skipped" | "Missed";
  disease?: string;
  prescribedBy?: string;
  patientId?: string;
  patientName?: string;
};

export type ActivityLog = {
  id: string;
  kind: "appointment" | "medication" | "auth" | "user";
  action: "created" | "updated" | "deleted" | "registered" | "logged_in";
  title: string;
  subtitle?: string;
  at: string; // ISO
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  avatar: string;
  bloodGroup?: string | null;
  height?: string | null;
  weight?: string | null;
  bmi?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  insurance?: string | null;
  lifestyle?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  role?: "patient" | "doctor" | "admin";
  specialization?: string | null;
  hospital?: string | null;
  availability?: string | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type Report = {
  id: string;
  title: string;
  description: string;
  format: string;
  reportType: string;
  generatedAt: string;
};

// API Helpers
function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  return "http://localhost:5000/api";
}

const API_BASE = getApiBase();

export const defaultAvatar = "/images/default-avatar.png";

export async function apiFetch(path: string, method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET", body?: any) {
  const token = localStorage.getItem("rk.token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = API_BASE.endsWith("/api") && cleanPath.startsWith("/api/")
    ? `${API_BASE.replace(/\/api$/, "")}${cleanPath}`
    : `${API_BASE}${cleanPath}`;

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem("rk.session");
    localStorage.removeItem("rk.token");
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = "API Request Failed";
    try {
      const parsed = JSON.parse(errorText);
      if (Array.isArray(parsed.error) && parsed.error.length > 0) {
        message = parsed.error.map((e: any) => e.message || e.field || JSON.stringify(e)).join(", ");
      } else if (typeof parsed.error === "string") {
        message = parsed.error;
      } else if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

// Data Mappers
function mapAppointmentToFrontend(api: any): Appointment {
  const today = new Date().toISOString().slice(0, 10);
  const apptDate = api.appointmentDate ? api.appointmentDate.split("T")[0] : "";
  const status = api.status === "Upcoming" && apptDate === today ? "Today" : api.status;

  return {
    id: api.id,
    patient: api.patientName,
    doctor: api.doctorName,
    spec: api.specialization || "",
    title: api.title,
    hospital: api.hospital || "",
    date: apptDate,
    time: api.appointmentTime,
    phone: api.user?.phone || "",
    email: api.user?.email || "",
    visitType: api.visitType === "Follow_up" ? "Follow-up" : (api.visitType === "Routine" ? "Routine Checkup" : api.visitType),
    priority: api.priority,
    notes: api.notes || "",
    status: status,
    calendarEventId: api.calendarEventId ?? null,
    calendarLink: api.calendarLink ?? null,
  };
}

function mapAppointmentToBackend(app: Partial<Appointment>) {
  return {
    patientName: app.patient,
    doctorName: app.doctor,
    title: app.title,
    hospital: app.hospital || null,
    specialization: app.spec || null,
    appointmentDate: app.date,
    appointmentTime: app.time,
    visitType: app.visitType === "Follow-up" ? "Follow_up" : (app.visitType === "Routine Checkup" ? "Routine" : app.visitType),
    priority: app.priority,
    notes: app.notes || null,
    status: app.status === "Today" ? "Upcoming" : app.status,
  };
}

function getSlotFromTime(time: string): "Morning" | "Afternoon" | "Evening" | "Night" {
  if (!time) return "Morning";
  const hour = parseInt(time.split(":")[0]);
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function mapMedicationToFrontend(api: any): Medication {
  return {
    id: api.id,
    name: api.medicineName,
    dosage: api.dosage,
    strength: api.strength || "",
    type: api.medicineType || "Tablet",
    frequency: api.frequency || "Once Daily",
    time: api.reminderTime,
    slot: getSlotFromTime(api.reminderTime),
    startDate: api.startDate ? api.startDate.split("T")[0] : "",
    endDate: api.endDate ? api.endDate.split("T")[0] : "",
    foodPref: api.foodPreference || "After Food",
    phone: api.phoneNumber || "",
    reminderEnabled: api.reminderEnabled,
    notes: api.notes || "",
    status: api.status,
    disease: api.disease || "",
    prescribedBy: api.prescribedBy || "",
    patientId: api.userId || "",
    patientName: api.user?.fullName || api.patientName || "",
  };
}

function mapMedicationToBackend(med: Partial<Medication> & { patientId?: string; disease?: string; prescribedBy?: string }) {
  return {
    medicineName: med.name,
    dosage: med.dosage,
    strength: med.strength || null,
    medicineType: med.type || null,
    frequency: med.frequency || null,
    reminderTime: med.time,
    startDate: med.startDate,
    endDate: med.endDate,
    foodPreference: med.foodPref || null,
    phoneNumber: med.phone || null,
    reminderEnabled: med.reminderEnabled ?? true,
    status: med.status,
    disease: med.disease || null,
    prescribedBy: med.prescribedBy || null,
    patientId: med.patientId || null,
    notes: med.notes || null,
  };
}

function mapActivityToFrontend(api: any): ActivityLog {
  const mod = api.module.toLowerCase();
  const kind = mod.includes("appointment") ? "appointment" : (mod.includes("medication") ? "medication" : (mod.includes("auth") ? "auth" : "user"));
  const act = api.action.toLowerCase();
  const action = act.includes("create") || act.includes("register") ? "created" : "updated";
  
  return {
    id: api.id,
    kind,
    action,
    title: api.description,
    subtitle: api.module,
    at: api.createdAt,
  };
}

function mapProfileToUser(api: any): User {
  return {
    id: api.id,
    name: api.fullName,
    email: api.email,
    phone: api.phone || "",
    dob: api.dateOfBirth ? api.dateOfBirth.split("T")[0] : "",
    gender: api.gender || "",
    avatar: api.profileImage || "",
    bloodGroup: api.bloodGroup ?? null,
    height: api.height ?? null,
    weight: api.weight ?? null,
    bmi: api.bmi ?? null,
    allergies: api.allergies ?? null,
    medicalConditions: api.medicalConditions ?? null,
    insurance: api.insurance ?? api.insuranceProvider ?? null,
    lifestyle: api.lifestyle ?? null,
    emergencyContactName: api.emergencyContactName ?? null,
    emergencyContactPhone: api.emergencyContactPhone ?? null,
    role: api.role || "patient",
    specialization: api.specialization ?? null,
    hospital: api.hospital ?? null,
    availability: api.availability ?? null,
  };
}

// Unified Store Creation Factory
export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();
  
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = () => state;
  const getServerSnapshot = () => initialState;

  return {
    get state() {
      return state;
    },
    set state(newValue: T) {
      if (state !== newValue) {
        state = newValue;
        listeners.forEach((l) => l());
      }
    },
    subscribe,
    getSnapshot,
    getServerSnapshot,
    use() {
      return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    }
  };
}

// 1. Auth Store
function getStoredAuthState() {
  if (typeof window === "undefined") {
    return { currentUser: null as User | null, token: null as string | null, hydrated: false };
  }

  try {
    const rawSession = localStorage.getItem("rk.session");
    const rawToken = localStorage.getItem("rk.token");

    if (rawSession && rawToken) {
      return {
        currentUser: JSON.parse(rawSession) as User,
        token: rawToken,
        hydrated: true,
      };
    }
  } catch {}

  return { currentUser: null as User | null, token: null as string | null, hydrated: false };
}

const authInner = createStore<{ currentUser: User | null; token: string | null; hydrated: boolean }>(getStoredAuthState());

export const authStore = {
  subscribe: authInner.subscribe,
  getSnapshot: authInner.getSnapshot,
  getServerSnapshot: authInner.getServerSnapshot,
  use() {
    return authInner.use().currentUser;
  },
  getCurrentUser() {
    this.hydrate();
    return authInner.state.currentUser;
  },
  getToken() {
    this.hydrate();
    return authInner.state.token;
  },
  useAuthState() {
    return authInner.use();
  },
  hydrate() {
    if (typeof window === "undefined") return;
    try {
      const rawSession = localStorage.getItem("rk.session");
      const rawToken = localStorage.getItem("rk.token");
      if (rawSession && rawToken) {
        const user = JSON.parse(rawSession);
        if (
          authInner.state.currentUser?.id !== user.id ||
          authInner.state.token !== rawToken ||
          !authInner.state.hydrated
        ) {
          authInner.state = { currentUser: user, token: rawToken, hydrated: true };
        }
      } else if (!authInner.state.hydrated) {
        authInner.state = { currentUser: null, token: null, hydrated: true };
      }
    } catch {}
  },
  emit() {
    const { currentUser, token } = authInner.state;
    if (typeof window !== "undefined") {
      if (currentUser && token) {
        localStorage.setItem("rk.session", JSON.stringify(currentUser));
        localStorage.setItem("rk.token", token);
      } else {
        localStorage.removeItem("rk.session");
        localStorage.removeItem("rk.token");
      }
    }
  },
  async register(user: Omit<User, "id"> & { password?: string; role?: "patient" | "doctor"; specialization?: string; hospital?: string }) {
    this.hydrate();
    const payload = {
      fullName: user.name,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
      phone: user.phone,
      dateOfBirth: user.dob || undefined,
      gender: user.gender || undefined,
      role: user.role || "patient",
      specialization: user.specialization || undefined,
      hospital: user.hospital || undefined,
    };
    const res = await apiFetch("/auth/register", "POST", payload);
    return res.data;
  },
  async login(email: string, password: string): Promise<boolean> {
    this.hydrate();
    const res = await apiFetch("/auth/login", "POST", { email, password });
    if (res.success && res.data.token) {
      const user = mapProfileToUser(res.data.user);
      authInner.state = { currentUser: user, token: res.data.token, hydrated: true };
      this.emit();
      return true;
    }
    return false;
  },
  logout() {
    authInner.state = { currentUser: null, token: null, hydrated: true };
    this.emit();
  },
  async updateProfile(updates: Partial<Omit<User, "id">>) {
    this.hydrate();
    const user = authInner.state.currentUser;
    if (!user) return;
    const payload = {
      fullName: updates.name !== undefined ? updates.name : user.name,
      phone: updates.phone !== undefined ? updates.phone : user.phone,
      dateOfBirth: updates.dob !== undefined ? updates.dob : user.dob,
      gender: updates.gender !== undefined ? updates.gender : user.gender,
      bloodGroup: updates.bloodGroup !== undefined ? updates.bloodGroup : user.bloodGroup,
      height: updates.height !== undefined ? updates.height : user.height,
      weight: updates.weight !== undefined ? updates.weight : user.weight,
      bmi: updates.bmi !== undefined ? updates.bmi : user.bmi,
      allergies: updates.allergies !== undefined ? updates.allergies : user.allergies,
      medicalConditions: updates.medicalConditions !== undefined ? updates.medicalConditions : user.medicalConditions,
      insurance: updates.insurance !== undefined ? updates.insurance : user.insurance,
      lifestyle: updates.lifestyle !== undefined ? updates.lifestyle : user.lifestyle,
      emergencyContactName: updates.emergencyContactName !== undefined ? updates.emergencyContactName : user.emergencyContactName,
      emergencyContactPhone: updates.emergencyContactPhone !== undefined ? updates.emergencyContactPhone : user.emergencyContactPhone,
      specialization: updates.specialization !== undefined ? updates.specialization : user.specialization,
      hospital: updates.hospital !== undefined ? updates.hospital : user.hospital,
      availability: updates.availability !== undefined ? updates.availability : user.availability,
    };
    const res = await apiFetch("/profile", "PUT", payload);
    if (res.success) {
      const updatedUser = mapProfileToUser(res.data);
      authInner.state = { ...authInner.state, currentUser: updatedUser, hydrated: true };
      this.emit();
      return updatedUser;
    }
  },
  async updatePhone(phone: string) {
    return await this.updateProfile({ phone });
  }
};

export function formatToE164Phone(phone: string): string {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, "").trim();
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^[2-9]\d{9}$/.test(cleaned)) return `+1${cleaned}`;
  return `+${cleaned}`;
}

// 2. Appointment Store
const appointmentsInner = createStore<Appointment[]>([]);

export const appointmentsStore = {
  subscribe: appointmentsInner.subscribe,
  getSnapshot: appointmentsInner.getSnapshot,
  getServerSnapshot: appointmentsInner.getServerSnapshot,
  use() {
    return appointmentsInner.use();
  },
  get() {
    return appointmentsInner.state;
  },
  async hydrate() {
    try {
      const data = await apiFetch("/appointments?limit=1000");
      if (data.success && data.data && Array.isArray(data.data.appointments)) {
        appointmentsInner.state = data.data.appointments.map(mapAppointmentToFrontend);
      } else {
        appointmentsInner.state = [];
      }
    } catch (err: any) {
      console.error("Failed to fetch appointments:", err);
      toast.error(err.message || "Failed to load appointments from server");
    }
  },
  async add(item: Omit<Appointment, "id">) {
    const payload = mapAppointmentToBackend(item);
    const res = await apiFetch("/appointments", "POST", payload);
    await this.hydrate();
    return mapAppointmentToFrontend(res.data);
  },
  async update(id: string, patch: Partial<Appointment>) {
    const payload = mapAppointmentToBackend(patch);
    await apiFetch(`/appointments/${id}`, "PUT", payload);
    await this.hydrate();
  },
  async reschedule(id: string, date: string, time: string, reason?: string) {
    await apiFetch(`/appointments/${id}`, "PUT", {
      appointmentDate: date,
      appointmentTime: time,
      rescheduleReason: reason,
    });
    await this.hydrate();
  },
  async remove(id: string) {
    await apiFetch(`/appointments/${id}`, "DELETE");
    await this.hydrate();
  },
  async sendSms(id: string, phoneNumber?: string) {
    return await apiFetch("/sms/send-appointment-reminder", "POST", { appointmentId: id, phoneNumber });
  },
  async syncCalendar(id: string) {
    const res = await apiFetch("/calendar/create-event", "POST", { appointmentId: id });
    await this.hydrate();
    return res;
  }
};

// 3. Medication Store
const medicationsInner = createStore<Medication[]>([]);

export const medicationsStore = {
  subscribe: medicationsInner.subscribe,
  getSnapshot: medicationsInner.getSnapshot,
  getServerSnapshot: medicationsInner.getServerSnapshot,
  use() {
    return medicationsInner.use();
  },
  get() {
    return medicationsInner.state;
  },
  async hydrate() {
    try {
      const data = await apiFetch("/medications?limit=1000");
      if (data.success && data.data && Array.isArray(data.data.medications)) {
        medicationsInner.state = data.data.medications.map(mapMedicationToFrontend);
      } else {
        medicationsInner.state = [];
      }
    } catch (err: any) {
      console.error("Failed to fetch medications:", err);
      toast.error(err.message || "Failed to load medications from server");
    }
  },
  async add(item: Omit<Medication, "id">) {
    const payload = mapMedicationToBackend(item);
    const res = await apiFetch("/medications", "POST", payload);
    await this.hydrate();
    return mapMedicationToFrontend(res.data);
  },
  async prescribe(item: Omit<Medication, "id"> & { patientId?: string; disease?: string; prescribedBy?: string }) {
    const payload = mapMedicationToBackend(item);
    const res = await apiFetch("/medications", "POST", payload);
    await this.hydrate();
    return mapMedicationToFrontend(res.data);
  },
  async adjustDosage(id: string, newDosage: string, improvementNote?: string, frequency?: string, notes?: string) {
    await apiFetch(`/medications/${id}`, "PUT", {
      dosage: newDosage,
      improvementNote,
      ...(frequency ? { frequency } : {}),
      ...(notes ? { notes } : {}),
    });
    await this.hydrate();
  },
  async update(id: string, patch: Partial<Medication>) {
    const payload = mapMedicationToBackend(patch);
    if (patch.status && Object.keys(patch).length === 1) {
      await apiFetch(`/medications/${id}/status`, "PATCH", { status: patch.status });
    } else {
      await apiFetch(`/medications/${id}`, "PUT", payload);
    }
    await this.hydrate();
  },
  async remove(id: string) {
    await apiFetch(`/medications/${id}`, "DELETE");
    await this.hydrate();
  },
  async sendSms(id: string) {
    return await apiFetch("/sms/send-medication-reminder", "POST", { medicationId: id });
  }
};

// 4. Activity Store
const activityInner = createStore<ActivityLog[]>([]);

export const activityStore = {
  subscribe: activityInner.subscribe,
  getSnapshot: activityInner.getSnapshot,
  getServerSnapshot: activityInner.getServerSnapshot,
  use() {
    return activityInner.use();
  },
  get() {
    return activityInner.state;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/activity");
      if (res.success && res.data.logs) {
        activityInner.state = res.data.logs.map(mapActivityToFrontend);
      }
    } catch (err) {
      console.error("Failed to hydrate activity logs:", err);
    }
  }
};

// 5. Notification Store
const notificationInner = createStore<Notification[]>([]);

export const notificationStore = {
  subscribe: notificationInner.subscribe,
  getSnapshot: notificationInner.getSnapshot,
  getServerSnapshot: notificationInner.getServerSnapshot,
  use() {
    return notificationInner.use();
  },
  get() {
    return notificationInner.state;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/notifications");
      if (res.success) {
        notificationInner.state = res.data.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }));
      }
    } catch (err) {
      console.error("Failed to hydrate notifications:", err);
    }
  },
  async markAsRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, "PATCH");
    await this.hydrate();
  },
  async markAllAsRead() {
    await apiFetch("/notifications/read-all", "PATCH");
    await this.hydrate();
  },
  async remove(id: string) {
    await apiFetch(`/notifications/${id}`, "DELETE");
    await this.hydrate();
  }
};

// 6. Dashboard Store
const dashboardInner = createStore<any>(null);

export const dashboardStore = {
  subscribe: dashboardInner.subscribe,
  getSnapshot: dashboardInner.getSnapshot,
  getServerSnapshot: dashboardInner.getServerSnapshot,
  use() {
    return dashboardInner.use();
  },
  get() {
    return dashboardInner.state;
  },
  async hydrate() {
    try {
      const [dashRes, statsRes] = await Promise.all([
        apiFetch("/dashboard"),
        apiFetch("/dashboard/stats"),
      ]);
      if (dashRes.success && statsRes.success) {
        dashboardInner.state = {
          overview: dashRes.data,
          stats: statsRes.data,
        };
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  }
};

// 7. Profile Store
export const profileStore = {
  subscribe: authInner.subscribe,
  getSnapshot: authInner.getSnapshot,
  getServerSnapshot: authInner.getServerSnapshot,
  use() {
    return authInner.use().currentUser;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/profile");
      if (res.success && res.data) {
        authInner.state = {
          currentUser: mapProfileToUser(res.data),
          token: authInner.state.token,
          hydrated: true,
        };
        authStore.emit();
      }
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
    }
  },
  async update(updates: Partial<Omit<User, "id">>) {
    await authStore.updateProfile(updates);
  }
};

// 8. Reports Store
const reportsInner = createStore<Report[]>([]);

export const reportsStore = {
  subscribe: reportsInner.subscribe,
  getSnapshot: reportsInner.getSnapshot,
  getServerSnapshot: reportsInner.getServerSnapshot,
  use() {
    return reportsInner.use();
  },
  get() {
    return reportsInner.state;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/reports");
      if (res.success) {
        reportsInner.state = res.data;
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  },
  async generate(reportType: string, format: string) {
    const res = await apiFetch("/reports/generate", "POST", { reportType, format });
    await this.hydrate();
    return res.data;
  },
  async remove(id: string) {
    await apiFetch(`/reports/${id}`, "DELETE");
    await this.hydrate();
  }
};

// 9. Settings Store
const settingsInner = createStore<any>(null);

export const settingsStore = {
  subscribe: settingsInner.subscribe,
  getSnapshot: settingsInner.getSnapshot,
  getServerSnapshot: settingsInner.getServerSnapshot,
  use() {
    return settingsInner.use();
  },
  get() {
    return settingsInner.state;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/settings");
      if (res.success) {
        settingsInner.state = res.data;
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  },
  async update(settings: any) {
    await apiFetch("/settings", "PUT", settings);
    await this.hydrate();
  }
};

// 10. AI Summary Store
const aiSummaryInner = createStore<any[]>([]);

export const aiSummaryStore = {
  subscribe: aiSummaryInner.subscribe,
  getSnapshot: aiSummaryInner.getSnapshot,
  getServerSnapshot: aiSummaryInner.getServerSnapshot,
  use() {
    return aiSummaryInner.use();
  },
  get() {
    return aiSummaryInner.state;
  },
  async hydrate() {
    try {
      const res = await apiFetch("/ai/summaries");
      if (res.success) {
        aiSummaryInner.state = res.data;
      }
    } catch (err) {
      console.error("Failed to fetch AI summaries:", err);
    }
  },
  async generate(appointmentId: string) {
    const res = await apiFetch("/ai/generate-summary", "POST", { appointmentId });
    await this.hydrate();
    return res.data;
  },
  async regenerate(id: string) {
    const res = await apiFetch(`/ai/summaries/${id}/regenerate`, "PUT");
    await this.hydrate();
    return res.data;
  },
  async remove(id: string) {
    await apiFetch(`/ai/summaries/${id}`, "DELETE");
    await this.hydrate();
  }
};

export type Patient = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
};

export type Doctor = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  specialization?: string;
  hospital?: string;
  availability?: string;
};

let patientsHydratePromise: Promise<void> | null = null;
let lastPatientsHydrate = 0;

const patientsInner = createStore<Patient[]>([]);
export const patientStore = {
  subscribe: patientsInner.subscribe,
  getSnapshot: patientsInner.getSnapshot,
  getServerSnapshot: patientsInner.getServerSnapshot,
  use: patientsInner.use,
  get: () => patientsInner.state,
  async hydrate() {
    const now = Date.now();
    if (now - lastPatientsHydrate < 1000 && patientsInner.state.length > 0) return;
    if (patientsHydratePromise) return patientsHydratePromise;
    patientsHydratePromise = (async () => {
      try {
        const res = await apiFetch("/users/patients");
        if (res.success && Array.isArray(res.data)) {
          patientsInner.state = res.data;
          lastPatientsHydrate = Date.now();
        }
      } catch {} finally {
        patientsHydratePromise = null;
      }
    })();
    return patientsHydratePromise;
  }
};

let doctorsHydratePromise: Promise<void> | null = null;
let lastDoctorsHydrate = 0;

const doctorsInner = createStore<Doctor[]>([]);
export const doctorStore = {
  subscribe: doctorsInner.subscribe,
  getSnapshot: doctorsInner.getSnapshot,
  getServerSnapshot: doctorsInner.getServerSnapshot,
  use: doctorsInner.use,
  get: () => doctorsInner.state,
  async hydrate() {
    const now = Date.now();
    if (now - lastDoctorsHydrate < 1000 && doctorsInner.state.length > 0) return;
    if (doctorsHydratePromise) return doctorsHydratePromise;
    doctorsHydratePromise = (async () => {
      try {
        const res = await apiFetch("/users/doctors");
        if (res.success && Array.isArray(res.data)) {
          doctorsInner.state = res.data;
          lastDoctorsHydrate = Date.now();
        }
      } catch {} finally {
        doctorsHydratePromise = null;
      }
    })();
    return doctorsHydratePromise;
  }
};

export function logActivity(entry: Omit<ActivityLog, "id" | "at">) {
  // Generated on the backend
}

let lastHydrateCallTime = 0;
export function hydrateAllStores() {
  const now = Date.now();
  if (now - lastHydrateCallTime < 600) return;
  lastHydrateCallTime = now;

  authStore.hydrate();
  appointmentsStore.hydrate();
  medicationsStore.hydrate();
  activityStore.hydrate();
  notificationStore.hydrate();
  dashboardStore.hydrate();
  settingsStore.hydrate();
  aiSummaryStore.hydrate();
  reportsStore.hydrate();
  patientStore.hydrate();
  doctorStore.hydrate();
}


export type SearchResult = {
  id: string;
  category: "Appointments" | "Medications" | "Reports" | "AI Summaries" | "Activity Logs";
  title: string;
  subtitle?: string;
  route: string;
};

// Global search state
let activeSearchQuery = "";
let highlightedId: string | null = null;
const searchListeners = new Set<() => void>();

export const searchStore = {
  getQuery() { return activeSearchQuery; },
  getHighlightedId() { return highlightedId; },
  setQuery(q: string) {
    activeSearchQuery = q;
    searchListeners.forEach((l) => l());
  },
  setHighlightedId(id: string | null) {
    highlightedId = id;
    searchListeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    searchListeners.add(l);
    return () => { searchListeners.delete(l); };
  },
  useQuery() {
    return useSyncExternalStore(searchStore.subscribe, searchStore.getQuery, searchStore.getQuery);
  },
  useHighlightedId() {
    return useSyncExternalStore(searchStore.subscribe, searchStore.getHighlightedId, searchStore.getHighlightedId);
  }
};

export function getSearchResults(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  appointmentsStore.get().forEach((a) => {
    if (
      a.title.toLowerCase().includes(q) ||
      a.doctor.toLowerCase().includes(q) ||
      a.patient.toLowerCase().includes(q) ||
      a.hospital.toLowerCase().includes(q) ||
      a.spec.toLowerCase().includes(q) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    ) {
      results.push({
        id: a.id,
        category: "Appointments",
        title: a.title,
        subtitle: `${a.doctor} · ${a.date}`,
        route: "/appointments",
      });
    }
  });

  medicationsStore.get().forEach((m) => {
    if (
      m.name.toLowerCase().includes(q) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    ) {
      results.push({
        id: m.id,
        category: "Medications",
        title: m.name,
        subtitle: `${m.dosage} · ${m.slot}`,
        route: "/medications",
      });
    }
  });

  return results;
}

export function getGoogleCalendarUrl(appt: Appointment): string {
  if (appt.calendarLink) return appt.calendarLink;
  const dateClean = (appt.date || "").replace(/-/g, "");
  const timeClean = (appt.time || "09:00").replace(/:/g, "") + "00";
  const start = `${dateClean}T${timeClean}`;
  const [h, m] = (appt.time || "09:00").split(":").map(Number);
  const endM = ((m || 0) + 30) % 60;
  const endH = (h || 9) + Math.floor(((m || 0) + 30) / 60);
  const endStr = `${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
  const end = `${dateClean}T${endStr}`;

  const title = encodeURIComponent(appt.title || "RK Health Appointment");
  const details = encodeURIComponent(
    `Consultation with Dr. ${appt.doctor}\nPatient: ${appt.patient}\nVisit Type: ${appt.visitType}\nNotes: ${appt.notes || ""}`
  );
  const location = encodeURIComponent(appt.hospital || "Clinic / Hospital");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

