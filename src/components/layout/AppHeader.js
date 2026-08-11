import { ref, computed } from "vue";
import DiscordAuth from "../ui/DiscordAuth.js";
import { bot } from "../../data/bot.js";
import { botProfile } from "../../store/botProfile.js";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/serveurs", label: "Serveurs" },
  { to: "/shop-admin", label: "Shop admin" },
  { to: "/shop-joueurs", label: "Shop joueurs" },
  { to: "/inventaire", label: "Inventaire" },
  { to: "/statut", label: "Statut" },
  { to: "/index", label: "Index" },
  { to: "/credits", label: "Crédits" },
];

export default {
  name: "AppHeader",
  components: { DiscordAuth },
  setup() {
    const mobileOpen = ref(false);
    const displayVersion = computed(() => (botProfile.profile?.version ? `v${botProfile.profile.version}` : bot.version));
    return { links, mobileOpen, bot, displayVersion };
  },
  template: /* html */ `
    <header class="site-header">
      <div class="wrap site-header__inner">
        <router-link to="/" class="brand">
          <span class="brand__mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="12" r="2" fill="currentColor"/><circle cx="15.5" cy="12" r="2" fill="currentColor"/></svg>
          </span>
          Beep
          <span class="brand__version mono">{{ displayVersion }}</span>
        </router-link>

        <nav class="site-nav">
          <router-link v-for="l in links" :key="l.to" :to="l.to">{{ l.label }}</router-link>
        </nav>

        <div class="header-actions">
          <DiscordAuth />
          <button class="btn btn--icon btn--subtle nav-toggle" @click="mobileOpen = !mobileOpen" aria-label="Ouvrir le menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div v-if="mobileOpen" class="wrap mobile-menu">
        <router-link v-for="l in links" :key="'m'+l.to" :to="l.to" @click="mobileOpen=false">{{ l.label }}</router-link>
      </div>
    </header>
  `,
};
