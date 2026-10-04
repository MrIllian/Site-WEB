// Inventaire réel : pour chaque serveur Discord en commun avec Beep, les
// rôles du membre et son économie Beep (solde, ressources, objets, poissons).
export async function fetchMyInventory() {
  let res;
  try {
    res = await fetch("/api/inventory", { credentials: "include" });
  } catch {
    return { success: false, servers: [], message: "Impossible de joindre Beep." };
  }
  if (!res.ok) return { success: false, servers: [], message: "Impossible de joindre Beep." };
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json)) return { success: false, servers: [], message: "Réponse inattendue de Beep." };
  return { success: true, servers: json };
}
