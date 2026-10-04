export function validateServerDraft(draft) {
  if (!draft.name.trim()) return "Le nom du serveur est requis.";
  if (!draft.ip.trim()) return "L'adresse IP est requise.";
  const port = Number(draft.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return "Le port doit être un nombre entre 1 et 65535.";
  }
  return null;
}

export function validateListingDraft(draft) {
  if (!draft.category || !draft.itemName) return "Choisissez un objet de votre inventaire.";
  if (!(Number.isInteger(Number(draft.quantity)) && Number(draft.quantity) > 0)) return "La quantité doit être un entier supérieur à 0.";
  if (!(Number.isInteger(Number(draft.price)) && Number(draft.price) > 0)) return "Le prix doit être un entier supérieur à 0.";
  if (!draft.rarity) return "Choisissez une rareté.";
  return null;
}
