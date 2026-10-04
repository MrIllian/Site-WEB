import { auth } from "../store/auth.js";
import { validateListingDraft } from "../lib/validations.js";

// Shop admin réel : les shops (/shopadmin) des serveurs Discord dont la
// personne connectée est membre, avec son solde PikaCoins sur chacun —
// l'économie de Beep est par serveur, pas globale.
export async function fetchMyShops() {
  let res;
  try {
    res = await fetch("/api/shops", { credentials: "include" });
  } catch {
    return { success: false, shops: [], message: "Impossible de joindre Beep." };
  }
  if (!res.ok) return { success: false, shops: [], message: "Impossible de joindre Beep." };
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json)) return { success: false, shops: [], message: "Réponse inattendue de Beep." };
  return { success: true, shops: json };
}

export async function buyShopItem(guildId, itemId) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous pour acheter." };
  let res;
  try {
    res = await fetch(`/api/shops/${guildId}/items/${itemId}/buy`, { method: "POST", credentials: "include" });
  } catch {
    return { success: false, message: "Impossible de joindre Beep." };
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    return { success: false, message: json?.message || "L'achat a échoué." };
  }
  return { success: true, message: json.message, item: json.item, balance: json.balance };
}

// Marché inter-membres réel (/market du bot) : un marché par serveur
// Discord, avec le solde et l'inventaire vendable de la personne.
export async function fetchMyMarkets() {
  let res;
  try {
    res = await fetch("/api/market", { credentials: "include" });
  } catch {
    return { success: false, markets: [], message: "Impossible de joindre Beep." };
  }
  if (!res.ok) return { success: false, markets: [], message: "Impossible de joindre Beep." };
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json)) return { success: false, markets: [], message: "Réponse inattendue de Beep." };
  return { success: true, markets: json };
}

async function postMarket(path, body) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous d'abord." };
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { success: false, message: "Impossible de joindre Beep." };
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) return { success: false, message: json?.message || "L'opération a échoué." };
  return { success: true, message: json.message };
}

export function buyListing(guildId, listingId) {
  return postMarket(`/api/market/${guildId}/listings/${listingId}/buy`);
}

export function cancelListing(guildId, listingId) {
  return postMarket(`/api/market/${guildId}/listings/${listingId}/cancel`);
}

export function createListing(guildId, draft) {
  const message = validateListingDraft(draft);
  if (message) return Promise.resolve({ success: false, message });
  return postMarket(`/api/market/${guildId}/listings`, {
    category: draft.category,
    itemName: draft.itemName,
    quantity: Number(draft.quantity),
    price: Number(draft.price),
    rarity: draft.rarity,
  });
}
