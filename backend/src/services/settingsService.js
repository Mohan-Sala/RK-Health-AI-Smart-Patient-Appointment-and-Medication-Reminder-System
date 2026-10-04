import fs from "fs";
import path from "path";

const settingsDir = "uploads/settings";
if (!fs.existsSync(settingsDir)) {
  fs.mkdirSync(settingsDir, { recursive: true });
}

const getFilePath = (userId) => path.join(settingsDir, `${userId}.json`);

const defaultSettings = {
  darkModePreference: false,
  emailNotifications: true,
  smsNotifications: true,
  reminderPreferences: "both",
  language: "en",
  timezone: "Asia/Kolkata",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "12h",
  privacySettings: {
    shareData: false,
  },
};

/**
 * Gets settings for the specified user ID
 */
export const getUserSettings = async (userId) => {
  const filePath = getFilePath(userId);
  if (!fs.existsSync(filePath)) {
    return defaultSettings;
  }
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData);
  } catch (err) {
    return defaultSettings;
  }
};

/**
 * Updates settings for the specified user ID
 */
export const updateUserSettings = async (userId, settings) => {
  const filePath = getFilePath(userId);
  const current = await getUserSettings(userId);
  const updated = { ...current, ...settings };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
};
