import { ref } from "vue";
import { auth, authActions } from "../../store/auth.js";

export default {
  name: "DiscordAuth",
  setup() {
    const menuOpen = ref(false);
    return { auth, authActions, menuOpen };
  },
  template: /* html */ `
    <div v-if="!auth.isAuthenticated" class="discord-auth">
      <button class="btn btn--discord btn--sm" :disabled="auth.isLoading" @click="authActions.login">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 5.4a17.3 17.3 0 0 0-4.3-1.3l-.2.4a12 12 0 0 1 3.8 1.9 15.6 15.6 0 0 0-15 0 12 12 0 0 1 3.8-1.9l-.2-.4A17.3 17.3 0 0 0 3.6 5.4C1.3 8.9.6 12.3.9 15.7a17.4 17.4 0 0 0 5.3 2.7l.7-1.1a11 11 0 0 1-1.7-.8l.4-.3a12.6 12.6 0 0 0 10.8 0l.4.3a11 11 0 0 1-1.7.8l.7 1.1a17.4 17.4 0 0 0 5.3-2.7c.4-4-.6-7.3-2.6-10.3ZM8.7 13.6c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.6.8 1.5 1.7c0 .9-.7 1.7-1.5 1.7Zm6.6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Z" fill="currentColor"/></svg>
        <span v-if="!auth.isLoading">Se connecter avec Discord</span>
        <span v-else>Connexion…</span>
      </button>
    </div>
    <div v-else class="discord-auth" style="position:relative">
      <button class="user-chip" @click="menuOpen = !menuOpen">
        <img v-if="auth.user.avatar" :src="auth.user.avatar" class="user-chip__avatar user-chip__avatar--img" alt="" />
        <span v-else class="user-chip__avatar">{{ auth.user.initials }}</span>
        <span class="user-chip__name">{{ auth.user.username }}</span>
      </button>
      <div v-if="menuOpen" class="server-picker__menu" style="right:0; left:auto; width:200px;" @mouseleave="menuOpen = false">
        <router-link to="/profil" class="server-picker__item" @click="menuOpen = false">Mon profil</router-link>
        <router-link to="/inventaire" class="server-picker__item" @click="menuOpen = false">Mon inventaire</router-link>
        <button class="server-picker__item" style="color:var(--coral)" @click="authActions.logout(); menuOpen = false">Se déconnecter</button>
      </div>
    </div>
  `,
};
