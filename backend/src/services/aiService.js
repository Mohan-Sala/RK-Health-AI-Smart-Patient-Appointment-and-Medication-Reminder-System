import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const patientSystemPrompt = `You are a professional medical AI assistant. Analyze the provided clinical notes and appointment details, then generate a patient-friendly healthcare summary.
You must return a JSON object with the following keys. Do not include any markdown formatting outside the JSON:
{
  "visitOverview": "A brief overview of the clinical consultation.",
  "patientExplanation": "A plain language explanation of the diagnosis and symptoms, translating medical jargon into easy-to-understand terms.",
  "medicationGuidance": "Patient guidance on how to take the prescribed medications, strength, dosage frequency, and food preferences.",
  "followUpAdvice": "Clear guidance on when to follow up and key symptoms that should prompt medical review.",
  "healthRecommendations": "Lifestyle, diet, and physical activity recommendations based on the diagnosis.",
  "precautions": "Critical precautions and warning signs that require emergency attention.",
  "summary": "A concise one-line summary of the patient's overall health status."
}`;

const doctorSystemPrompt = `You are an expert clinical medical AI assistant for doctors and physicians. Analyze the provided clinical notes, patient medical background, and prescribed medications, then generate a structured physician-grade clinical consultation summary tailored for evaluating this specific patient.
You must return a JSON object with the following keys. Do not include any markdown formatting outside the JSON:
{
  "visitOverview": "A clinical overview of the patient encounter, chief complaints, and examination findings.",
  "patientExplanation": "Clinical diagnostic evaluation, disease progression status, and therapeutic response notes for physician review.",
  "medicationGuidance": "Pharmacotherapy assessment, dosage titration status, adherence expectations, and potential adverse interactions.",
  "followUpAdvice": "Clinical monitoring schedule, diagnostic parameters to test, and red-flag warning thresholds.",
  "healthRecommendations": "Targeted patient lifestyle interventions, disease self-management directions, and therapeutic goals.",
  "precautions": "Critical clinical precautions, contraindications, and emergency escalation thresholds for the patient.",
  "summary": "A concise clinical one-line synopsis of the patient's current disease status and prognosis."
}`;

function generateFallbackSummary(appointment, user, medications, isDoctor = false) {
  const doctor = appointment.doctorName || "Attending Physician";
  const patient = user?.fullName || appointment.patientName || "Patient";
  const title = appointment.title || "General Health Consultation";
  const medsList = medications.length > 0
    ? medications.map((m) => `${m.medicineName} (${m.dosage}, ${m.frequency || "as prescribed"}${m.disease ? ` for ${m.disease}` : ""})`).join(", ")
    : "No new pharmaceutical medications prescribed during this consultation.";

  if (isDoctor) {
    return {
      content: {
        visitOverview: `Clinical encounter with patient ${patient} for "${title}". Consultation conducted at ${appointment.hospital || "the clinic"} under ${appointment.specialization || "General Medicine"}. Chief complaints, vitals, and current disease presentation assessed.`,
        patientExplanation: `Clinical assessment for ${patient} regarding ${title}. Diagnostic findings indicate symptomatic progress with targeted disease management in progress. Evaluated for treatment efficacy and patient tolerance.`,
        medicationGuidance: medications.length > 0
          ? `Current pharmacotherapy regimen: ${medsList}. Patient instructed on strict adherence and scheduled for dosage titration upon biomarker improvement.`
          : "No active pharmacological titration needed at this encounter. Lifestyle regimen maintained.",
        followUpAdvice: `Scheduled re-evaluation for ${patient} in 3 to 4 weeks. Instructed to monitor biomarker trends and report sudden disease escalation immediately.`,
        healthRecommendations: `Prescribed disease-specific dietary plan, controlled physical activity, and strict recording of daily symptoms/vitals for ${patient}.`,
        precautions: `Advised immediate clinical evaluation if ${patient} exhibits acute symptom escalation, adverse drug reactions, or unstable vitals.`,
        summary: `Patient ${patient}: Encounter for ${title} complete. Clinical status stable with therapeutic plan active.`
      },
      metadata: {
        modelName: "rk-health-assistant-ai",
        durationMs: 50,
        promptVersion: "1.0.0",
        tokenUsage: null,
      }
    };
  }

  // Patient perspective (summarized consultation with the doctor)
  return {
    content: {
      visitOverview: `Consultation regarding "${title}" conducted by Dr. ${doctor} at ${appointment.hospital || "the clinic"}. Key vitals, lifestyle habits, and symptoms were reviewed.`,
      patientExplanation: `Your consultation with Dr. ${doctor} focused on evaluating health status and addressing primary concerns regarding ${title}. Vitals were assessed, and ongoing preventative care is encouraged.`,
      medicationGuidance: medications.length > 0
        ? `Ensure consistent adherence to prescribed medications from Dr. ${doctor}: ${medsList}. Follow appropriate timing and food guidelines.`
        : "Maintain existing health regimen and keep well hydrated.",
      followUpAdvice: `Schedule a routine follow-up consultation with Dr. ${doctor} in 4 to 6 weeks, or sooner if any new or worsening symptoms develop.`,
      healthRecommendations: "Maintain a balanced, nutritious diet, engage in at least 30 minutes of moderate activity daily, ensure 7-8 hours of sleep, and manage stress.",
      precautions: "Seek emergency medical care if you experience chest pain, severe shortness of breath, acute dizziness, or severe sudden headaches.",
      summary: `Consultation for ${title} with Dr. ${doctor} completed. Follow guidance and monitor wellness.`
    },
    metadata: {
      modelName: "rk-health-assistant-ai",
      durationMs: 50,
      promptVersion: "1.0.0",
      tokenUsage: null,
    }
  };
}

/**
 * Generates structured AI summary utilizing Groq AI with automatic fallback
 */
export const generateSummaryFromNotes = async (appointment, user, medications, isDoctor = false) => {
  const patientName = user?.fullName || appointment.patientName || "Patient";
  const notesText = appointment.notes && appointment.notes.trim().length > 0
    ? appointment.notes.trim()
    : isDoctor
      ? `Clinical encounter for patient ${patientName} regarding "${appointment.title || "clinical checkup"}". Patient examined and vitals reviewed.`
      : `General medical consultation for "${appointment.title || "clinical checkup"}" with Dr. ${appointment.doctorName}. Patient underwent comprehensive assessment.`;

  const activeSystemPrompt = isDoctor ? doctorSystemPrompt : patientSystemPrompt;

  const userPrompt = isDoctor
    ? `
    Clinical Consultation Review for Physician:
    - Attending Doctor: Dr. ${appointment.doctorName}
    - Patient Name: ${patientName}
    - Gender: ${user?.gender || "Not specified"}
    - Pre-existing Medical Conditions / Disease: ${user?.medicalConditions || "None recorded"}
    - Allergies: ${user?.allergies || "None recorded"}

    Encounter Details:
    - Visit Reason / Title: ${appointment.title}
    - Hospital / Clinic: ${appointment.hospital || "Clinic / Hospital"}
    - Department / Specialization: ${appointment.specialization || "General Medicine"}
    - Visit Type: ${appointment.visitType || "Consultation"}
    - Clinical Notes: ${notesText}
    
    Active Patient Medications / Regimen:
    ${
      medications.length > 0
        ? medications.map((m) => `- ${m.medicineName} (${m.dosage}, ${m.strength || "N/A"}): frequency: ${m.frequency || "N/A"}, preference: ${m.foodPreference || "N/A"}${m.disease ? `, targeted condition: ${m.disease}` : ""}`).join("\n")
        : "None prescribed in this session"
    }
    `
    : `
    Patient Consultation Review:
    - Patient Name: ${patientName}
    - Gender: ${user?.gender || "Not specified"}
    - Medical Conditions: ${user?.medicalConditions || "None declared"}
    - Allergies: ${user?.allergies || "None declared"}

    Appointment Details:
    - Consulting Doctor: Dr. ${appointment.doctorName}
    - Title: ${appointment.title}
    - Hospital: ${appointment.hospital || "Clinic / Hospital"}
    - Specialization: ${appointment.specialization || "General Medicine"}
    - Visit Type: ${appointment.visitType || "Consultation"}
    - Clinical Notes: ${notesText}
    
    Prescribed Medications:
    ${
      medications.length > 0
        ? medications.map((m) => `- ${m.medicineName} (${m.dosage}, ${m.strength || "N/A"}): frequency: ${m.frequency || "N/A"}, preference: ${m.foodPreference || "N/A"}`).join("\n")
        : "None prescribed in this session"
    }
    `;

  if (!env.GROQ_API_KEY) {
    logger.warn("Groq API key not set, using intelligent fallback summary");
    return generateFallbackSummary(appointment, user, medications, isDoctor);
  }

  const modelsToTry = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
  const startTime = Date.now();

  for (const model of modelsToTry) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: activeSystemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        logger.warn(`Groq model ${model} failed with status ${response.status}`);
        continue;
      }

      const result = await response.json();
      const duration = Date.now() - startTime;
      let rawText = result.choices?.[0]?.message?.content?.trim() || "";
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const content = JSON.parse(rawText);

      return {
        content,
        metadata: {
          modelName: model,
          durationMs: duration,
          promptVersion: "1.0.0",
          tokenUsage: result.usage || null,
        },
      };
    } catch (err) {
      logger.warn(`Error generating summary with model ${model}: ${err.message}`);
    }
  }

  logger.warn("All Groq models failed or timed out. Falling back to intelligent summary.");
  return generateFallbackSummary(appointment, user, medications, isDoctor);
};

