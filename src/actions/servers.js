/*
 * Ces actions parlent au vrai backend (server/index.js), qui relaie
 * lui-même vers l'API interne du bot Beep. Chaque action renvoie
 * { success, message? } — même schéma qu'avant, seule l'implémentation
 * change (fetch réseau au lieu de mutation locale).
 */

const ERROR_MESSAGES = {
  forbidden: "Vous n'êtes pas administrateur de ce serveur Discord.",
  unauthorized: "Connectez-vous avec Discord pour continuer.",
  guild_not_found: "Beep n'est plus présent sur ce serveur Discord.",
  name_required: "Le nom du serveur est requis.",
  ip_required: "L'adresse IP est requise.",
  invalid_port: "Le port doit être un nombre entre 1 et 65535.",
  invalid_tags: "Tags invalides.",
  bot_api_unavailable: "Le bot Beep est injoignable pour l'instant, réessayez plus tard.",
};

function friendlyError(code, fallback) {
  return ERROR_MESSAGES[code] || fallback;
}

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(path, { credentials: "include", ...options });
  } catch {
    return { ok: false, status: 0, json: { error: "bot_api_unavailable" } };
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* pas de corps JSON, ok si status l'explique déjà */
  }
  return { ok: res.ok, status: res.status, json };
}

export async function fetchPublicServers() {
  const { ok, json } = await apiFetch("/api/servers");
  if (!ok) {
    return { success: false, message: friendlyError(json?.error, "Impossible de charger les serveurs."), servers: [] };
  }
  return { success: true, servers: json || [] };
}

export async function fetchGuildServer(guildId) {
  const { ok, json } = await apiFetch(`/api/servers/${guildId}`);
  if (!ok) {
    return { success: false, message: friendlyError(json?.error, "Impossible de charger ce serveur.") };
  }
  return { success: true, server: json };
}

export async function saveServerSettings(guildId, draft) {
  const { ok, json } = await apiFetch(`/api/servers/${guildId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!ok) {
    return { success: false, message: friendlyError(json?.error, "Échec de l'enregistrement.") };
  }
  return { success: true, server: json };
}

export async function voteServer(guildId, direction) {
  const { ok, json } = await apiFetch(`/api/servers/${guildId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  if (!ok) {
    return { success: false, message: friendlyError(json?.error, "Impossible d'enregistrer le vote.") };
  }
  return { success: true, ...json };
}

export async function addServerComment(guildId, body) {
  if (!body.trim()) {
    return { success: false, message: "Le commentaire est vide." };
  }
  const { ok, json } = await apiFetch(`/api/servers/${guildId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!ok) {
    return { success: false, message: friendlyError(json?.error, "Impossible de publier le commentaire.") };
  }
  return { success: true, comment: json };
}
