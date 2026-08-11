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
