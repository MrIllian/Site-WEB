import { auth } from "../store/auth.js";

export function setAccent(accentId) {
  auth.user.settings.accent = accentId;
  return { success: true };
}

export function toggleSetting(key) {
  auth.user.settings[key] = !auth.user.settings[key];
  return { success: true };
}
