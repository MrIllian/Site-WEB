import { onMounted, onBeforeUnmount } from "vue";

/*
 * Garde une page synchronisée avec le bot sans recharger : relance `load`
 * toutes les `intervalMs` tant que l'onglet est visible, et dès qu'on
 * revient sur l'onglet (ex. après avoir fait un achat sur Discord).
 */
export function useAutoRefresh(load, intervalMs = 30000) {
  let timer = null;

  function refreshIfVisible() {
    if (document.visibilityState === "visible") load();
  }

  onMounted(() => {
    timer = setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
  });

  onBeforeUnmount(() => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", refreshIfVisible);
  });
}
