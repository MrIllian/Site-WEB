export function formatNumber(amount) {
  return amount.toLocaleString("fr-FR");
}

export const coins = formatNumber;

export function initials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}
