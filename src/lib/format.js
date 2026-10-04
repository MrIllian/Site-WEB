export function formatNumber(amount) {
  return amount.toLocaleString("fr-FR");
}

export const coins = formatNumber;

export function initials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}

export function relativeTime(epochSeconds) {
  if (!epochSeconds) return "";
  const diffMin = Math.floor((Date.now() - epochSeconds * 1000) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `il y a ${diffD} j`;
  return new Date(epochSeconds * 1000).toLocaleDateString("fr-FR");
}

export function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Durée écoulée depuis une date ISO, ex. « 3j 4h », « 2h 15min », « 12min ».
export function formatUptime(isoString) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  return `${minutes}min`;
}
