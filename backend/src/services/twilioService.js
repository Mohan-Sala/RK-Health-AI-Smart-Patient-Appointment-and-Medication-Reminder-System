import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Normalizes any raw phone number into standard international E.164 format (+<country_code><number>)
 * Examples:
 *   "9014241234"      -> "+919014241234" (Indian 10-digit mobile)
 *   "09014241234"     -> "+919014241234" (with leading 0)
 *   "+91 90142 41234" -> "+919014241234"
 *   "919014241234"    -> "+919014241234"
 *   "+1 501 712 2661" -> "+15017122661"
 */
export const formatToE164 = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, "").trim();
  if (!cleaned) return "";

  // Already in valid international format
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Starts with international prefix '00'
  if (cleaned.startsWith("00")) {
    return `+${cleaned.slice(2)}`;
  }

  // 10-digit Indian mobile number starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 11-digit starting with 0 followed by Indian mobile (e.g., 09014241234)
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }

  // 12-digit Indian number starting with country code 91
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // 10-digit US/Canada number
  if (/^[2-9]\d{9}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  // Fallback: prepend '+'
  return `+${cleaned}`;
};

/**
 * Sends SMS notifications utilizing Twilio REST API
 * @param {string} to - Recipient phone number (normalized to E.164)
 * @param {string} body - SMS message content
 * @returns {Promise<{success: boolean, sid?: string, phone?: string, simulated?: boolean, warning?: string, error?: string}>}
 */
export const sendSms = async (to, body) => {
  const formattedTo = formatToE164(to);
  if (!formattedTo) {
    logger.warn("⚠️ Twilio sendSms skipped: No valid recipient phone number provided.");
    return { success: false, error: "Recipient phone number is missing or invalid." };
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    logger.warn("⚠️ Twilio credentials missing in environment variables. Simulating SMS delivery.");
    return {
      success: true,
      simulated: true,
      sid: `SIM_${Date.now()}`,
      phone: formattedTo,
    };
  }

  // Format basic auth and request parameters
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const params = new URLSearchParams();
  params.append("To", formattedTo);
  params.append("From", env.TWILIO_PHONE_NUMBER);
  params.append("Body", body);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const code = data.code;
      const rawMsg = data.message || `Twilio request failed with status ${response.status}`;
      logger.warn(`⚠️ Twilio API rejected dispatch to ${formattedTo} (Status ${response.status}, Code ${code}): ${rawMsg}`);

      // Provide clear, actionable diagnostic messages for common Twilio trial / setup issues
      let friendlyError = rawMsg;
      if (code === 21608 || rawMsg.toLowerCase().includes("unverified")) {
        friendlyError = `Twilio Trial restriction: Number ${formattedTo} is unverified. Please add it to 'Verified Caller IDs' in Twilio Console.`;
      } else if (code === 21408 || rawMsg.toLowerCase().includes("permission to send an sms")) {
        friendlyError = `Twilio Geo-Permission restriction: SMS to ${formattedTo} is not enabled. Please enable India under Twilio SMS Geo-Permissions.`;
      } else if (code === 21660) {
        friendlyError = `Twilio configuration error: Sender number ${env.TWILIO_PHONE_NUMBER} does not belong to your Twilio account.`;
      }

      return {
        success: false,
        error: friendlyError,
        code,
        phone: formattedTo,
      };
    }

    logger.info(`✉️ SMS sent successfully via Twilio. SID: ${data.sid} to ${formattedTo}`);
    return { success: true, sid: data.sid, phone: formattedTo };
  } catch (err) {
    logger.error("❌ Twilio send SMS service failed:", err.message);
    return { success: false, error: err.message, phone: formattedTo };
  }
};

