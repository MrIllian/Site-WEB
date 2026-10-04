import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", name: "home", component: () => import("../pages/HomePage.js") },
  { path: "/serveurs", name: "servers", component: () => import("../pages/ServersPage.js") },
  { path: "/shop-admin", name: "shop-admin", component: () => import("../pages/ShopAdminPage.js") },
  { path: "/shop-joueurs", name: "shop-players", component: () => import("../pages/ShopPlayersPage.js") },
  { path: "/profil", name: "profile", component: () => import("../pages/ProfilePage.js") },
  { path: "/inventaire", name: "inventory", component: () => import("../pages/InventoryPage.js") },
  { path: "/statut", name: "status", component: () => import("../pages/StatusPage.js") },
  { path: "/index", name: "commands-index", component: () => import("../pages/IndexPage.js") },
  { path: "/credits", name: "credits", component: () => import("../pages/CreditsPage.js") },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Les pages sont chargées à la demande. Si le site a été mis à jour pendant
// qu'un onglet était ouvert, cet onglet garde en mémoire les ANCIENNES
// versions des modules communs (lib/format.js…) : la nouvelle page qu'on
// ouvre peut alors ne pas trouver ce qu'elle importe, et la navigation
// échoue sans rien afficher (ex. « Accueil » qui ne fait rien). Dans ce
// cas, on recharge le site directement sur la page demandée — une seule
// fois, pour ne jamais boucler si l'erreur venait d'ailleurs.
const RELOAD_KEY = "beep_reload_after_update";

router.onError((error, to) => {
  const isModuleError =
    error instanceof SyntaxError ||
    /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      String(error?.message)
    );
  if (!isModuleError) return;

  let lastReload = 0;
  try {
    lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
  } catch {}
  if (Date.now() - lastReload < 10000) return;
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {}

  window.location.hash = to.fullPath;
  window.location.reload();
});
