import { servers } from "../data/servers.js";
import { auth } from "../store/auth.js";
import { validateServerDraft } from "../lib/validations.js";
import { uid } from "../lib/utils.js";

/**
 * Actions mutate the in-memory `servers` store the same way a real
 * implementation would call the Beep API. Each action returns
 * { success, message? } so pages can surface a failure without a try/catch.
 */

export function voteServer(server, direction) {
  if (!auth.isAuthenticated) {
    return { success: false, message: "Connectez-vous pour voter." };
  }
  const prev = server.userVote;
  if (prev === direction) {
    if (direction === 1) server.upvotes--;
    else server.downvotes--;
    server.userVote = 0;
  } else {
    if (prev === 1) server.upvotes--;
    if (prev === -1) server.downvotes--;
    if (direction === 1) server.upvotes++;
    else server.downvotes++;
    server.userVote = direction;
  }
  return { success: true };
}

export async function saveServerSettings(serverId, draft) {
  const message = validateServerDraft(draft);
  if (message) return { success: false, message };

  await new Promise((resolve) => setTimeout(resolve, 550));

  const server = servers.find((s) => s.id === serverId);
  if (!server) return { success: false, message: "Serveur introuvable." };

  Object.assign(server, {
    name: draft.name.trim(),
    ip: draft.ip.trim(),
    port: Number(draft.port),
    description: draft.description,
    tags: [...draft.tags],
    isPublic: draft.isPublic,
  });
  return { success: true };
}

export function addServerComment(server, text) {
  if (!auth.isAuthenticated) {
    return { success: false, message: "Connectez-vous pour commenter." };
  }
  if (!text.trim()) {
    return { success: false, message: "Le commentaire est vide." };
  }
  server.comments.unshift({
    id: uid("c"),
    author: auth.user.username,
    time: "à l'instant",
    body: text.trim(),
  });
  return { success: true };
}
