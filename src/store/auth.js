import { reactive } from "vue";
import { currentUser } from "../data/profile.js";
import { currentUserAdminServerIds } from "../data/servers.js";

/*
 * Authentification simulée : il n'y a pas de vrai flux OAuth2 Discord ici
 * (nécessite un client_id/secret d'application Discord côté bot Beep).
 * Le store expose la même forme de données qu'un vrai flux OAuth
 * renverrait, pour que le branchement futur ne touche que ce fichier.
 */
const STORAGE_KEY = "beep_demo_session";

const state = reactive({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  adminServerIds: [],
});

if (localStorage.getItem(STORAGE_KEY) === "1") {
  state.user = currentUser;
  state.adminServerIds = currentUserAdminServerIds;
  state.isAuthenticated = true;
}

async function login() {
  if (state.isAuthenticated || state.isLoading) return;
  state.isLoading = true;
  await new Promise((resolve) => setTimeout(resolve, 700));
  state.user = currentUser;
  state.adminServerIds = currentUserAdminServerIds;
  state.isAuthenticated = true;
  state.isLoading = false;
  localStorage.setItem(STORAGE_KEY, "1");
}

function logout() {
  state.isAuthenticated = false;
  state.user = null;
  state.adminServerIds = [];
  localStorage.removeItem(STORAGE_KEY);
}

// Not wrapped in readonly(): pages mutate nested fields directly
// (auth.user.pikaCoins, auth.user.settings.*), same pattern as the
// other mock data stores. isAuthenticated/user should still only be
// set via login()/logout() below, by convention.
export const auth = state;
export const authActions = { login, logout };
