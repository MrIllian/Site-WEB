import { reactive, watch } from "vue";
import { initials } from "../lib/format.js";

/*
 * Authentification réelle via l'API OAuth2 Discord exposée par le
 * backend (voir server/index.js). Le navigateur ne voit jamais le
 * client_secret ni le token Discord : il ne fait que suivre la
 * redirection /api/auth/login puis lire la session via /api/auth/me.
 *
 * Il n'y a pas encore de vraie base de données pour les PikaCoins,
 * badges, etc. (ça viendra avec l'API du bot Beep). En attendant,
 * l'identité (id, pseudo, avatar) est réelle, mais le reste du profil
 * est un profil "par défaut" persisté localement par id Discord, pour
 * que chaque personne qui se connecte ait bien SES propres données et
 * pas celles de quelqu'un d'autre.
 */

const PROFILE_KEY_PREFIX = "beep_profile_";

const state = reactive({
  isAuthenticated: false,
  isLoading: false,
  isReady: false, // devient true une fois le premier /api/auth/me résolu
  user: null,
  adminServerIds: [],
  adminGuilds: [], // [{ id, name }] — serveurs Discord où la personne est admin
});

function defaultProfile() {
  return {
    pikaCoins: 0,
    pikaCoinsHistory: [],
    settings: {
      accent: "violet",
      showBadges: true,
      publicProfile: true,
      compactCards: false,
      bio: "",
    },
    badges: [],
  };
}

function loadLocalProfile(discordUser) {
  const key = PROFILE_KEY_PREFIX + discordUser.id;
  let persisted = {};
  try {
    persisted = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    persisted = {};
  }
  return {
    id: discordUser.id,
    username: discordUser.username,
    handle: discordUser.handle,
    initials: initials(discordUser.username),
    avatar: discordUser.avatar,
    memberSince: persisted.memberSince || new Date().toISOString().slice(0, 10),
    ...defaultProfile(),
    ...persisted,
  };
}

function persistLocalProfile() {
  if (!state.user) return;
  const { id, username, handle, initials: _initials, avatar, ...persisted } = state.user;
  localStorage.setItem(PROFILE_KEY_PREFIX + id, JSON.stringify(persisted));
}

watch(() => state.user, persistLocalProfile, { deep: true });

async function refresh() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    if (data.user) {
      state.user = loadLocalProfile(data.user);
      state.adminServerIds = data.user.adminGuildIds || [];
      state.adminGuilds = data.user.adminGuilds || [];
      state.isAuthenticated = true;
    } else {
      state.user = null;
      state.adminServerIds = [];
      state.adminGuilds = [];
      state.isAuthenticated = false;
    }
  } catch {
    // API indisponible (ex: prévisualisation statique sans backend) :
    // on reste simplement déconnecté plutôt que de planter la page.
    state.isAuthenticated = false;
  } finally {
    state.isReady = true;
  }
}

function login() {
  state.isLoading = true;
  window.location.href = "/api/auth/login";
}

async function logout() {
  state.isAuthenticated = false;
  state.user = null;
  state.adminServerIds = [];
  state.adminGuilds = [];
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
}

refresh();

export const auth = state;
export const authActions = { login, logout, refresh };
