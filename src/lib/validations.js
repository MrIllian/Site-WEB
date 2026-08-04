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
  if (!draft.item.trim()) return "Le nom de l'objet est requis.";
  if (!(Number(draft.price) > 0)) return "Le prix doit être supérieur à 0.";
  return null;
}
