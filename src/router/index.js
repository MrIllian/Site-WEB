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
