export async function fetchBotProfile() {
  let res;
  try {
    res = await fetch("/api/bot-profile", { credentials: "include" });
  } catch {
    return { success: false };
  }
  if (!res.ok) return { success: false };
  const json = await res.json().catch(() => null);
  if (!json) return { success: false };
  return { success: true, profile: json };
}

export async function fetchCommands() {
  let res;
  try {
    res = await fetch("/api/commands", { credentials: "include" });
  } catch {
    return { success: false, categories: [] };
  }
  if (!res.ok) return { success: false, categories: [] };
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json)) return { success: false, categories: [] };
  return { success: true, categories: json };
}
