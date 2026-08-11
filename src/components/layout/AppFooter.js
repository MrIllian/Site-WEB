import { computed } from "vue";
import { bot } from "../../data/bot.js";
import { botProfile } from "../../store/botProfile.js";

export default {
  name: "AppFooter",
  setup() {
    const displayVersion = computed(() => (botProfile.profile?.version ? `v${botProfile.profile.version}` : bot.version));
    return { bot, displayVersion, year: new Date().getFullYear() };
  },
  template: /* html */ `
    <footer class="site-footer">
      <div class="wrap" style="display:flex; flex-wrap:wrap; gap:32px; justify-content:space-between;">
        <div style="max-width:320px;">
          <div class="brand" style="margin-bottom:10px;">
            <span class="brand__mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="12" r="2" fill="currentColor"/><circle cx="15.5" cy="12" r="2" fill="currentColor"/></svg>
            </span>
            Beep <span class="brand__version mono">{{ displayVersion }}</span>
          </div>
          <p>Compagnon Discord pour serveurs Minecraft — classements, shops, économie et supervision, sans quitter votre serveur.</p>
        </div>
        <div>
          <div class="eyebrow" style="margin-bottom:12px;">Navigation</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <router-link to="/serveurs">Serveurs Minecraft</router-link>
            <router-link to="/shop-joueurs">Shop inter-joueurs</router-link>
            <router-link to="/statut">Statut de Beep</router-link>
            <router-link to="/index">Index des commandes</router-link>
            <router-link to="/credits">Crédits</router-link>
          </div>
        </div>
        <div>
          <div class="eyebrow" style="margin-bottom:12px;">Communauté</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <a href="#">Serveur Discord</a>
            <a href="#">Inviter Beep</a>
            <router-link to="/index">Documentation</router-link>
          </div>
        </div>
      </div>
      <div class="wrap" style="margin-top:36px; padding-top:20px; border-top:1px solid var(--line); display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <span>© {{ year }} Beep — projet indépendant, non affilié à Discord ou Mojang.</span>
        <span class="mono">renardis.fr</span>
      </div>
    </footer>
  `,
};
