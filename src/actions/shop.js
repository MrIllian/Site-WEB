import { auth } from "../store/auth.js";
import { marketByServer } from "../data/shop.js";
import { validateListingDraft } from "../lib/validations.js";
import { uid } from "../lib/utils.js";

function recordCoinMovement(label, delta) {
  auth.user.pikaCoinsHistory.unshift({
    id: uid("h"),
    label,
    delta,
    time: "à l'instant",
  });
}

export function buyAdminItem(item) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous pour acheter." };
  if (auth.user.pikaCoins < item.price) return { success: false, message: "Solde insuffisant." };

  auth.user.pikaCoins -= item.price;
  recordCoinMovement("Achat — " + item.name, -item.price);
  return { success: true };
}

export function buyMarketListing(serverId, listing) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous pour acheter." };
  if (auth.user.pikaCoins < listing.price) return { success: false, message: "Solde insuffisant." };

  auth.user.pikaCoins -= listing.price;
  recordCoinMovement("Achat — " + listing.item, -listing.price);

  const arr = marketByServer[serverId] || [];
  const idx = arr.findIndex((l) => l.id === listing.id);
  if (idx > -1) arr.splice(idx, 1);
  return { success: true };
}

export function placeBid(listing, amount) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous pour enchérir." };
  if (!(amount > listing.price)) {
    return { success: false, message: "L'enchère doit dépasser le prix actuel." };
  }
  listing.price = amount;
  listing.bids = (listing.bids || 0) + 1;
  return { success: true };
}

export function createListing(serverId, draft) {
  if (!auth.isAuthenticated) return { success: false, message: "Connectez-vous pour vendre." };
  const message = validateListingDraft(draft);
  if (message) return { success: false, message };

  const arr = marketByServer[serverId] || (marketByServer[serverId] = []);
  arr.unshift({
    id: uid("m"),
    type: draft.type,
    item: draft.item.trim(),
    icon: "🎁",
    seller: auth.user.username,
    price: Number(draft.price),
    bids: draft.type === "enchere" ? 0 : undefined,
    endsIn: draft.type === "enchere" ? "24:00:00" : undefined,
  });
  return { success: true };
}
