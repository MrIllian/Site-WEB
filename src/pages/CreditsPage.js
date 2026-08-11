import { computed } from "vue";
import { credits } from "../data/credits.js";
import { bot } from "../data/bot.js";
import { botProfile } from "../store/botProfile.js";

export default {
  name: "CreditsPage",
  setup() {
    const displayVersion = computed(() => (botProfile.profile?.version ? `v${botProfile.profile.version}` : bot.version));
    return { credits, bot, displayVersion };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Derrière Beep</span>
          <h2>Crédits</h2>
          <p>{{ displayVersion }} — l'équipe qui fait tourner Beep au quotidien.</p>
        </div>
      </div>

      <div class="credits-grid">
        <div class="card bracketed" v-for="c in credits" :key="c.role">
          <div class="credit-card__role eyebrow">{{ c.role }}</div>
          <div class="credit-card__members">
            <div class="credit-member" v-for="m in c.members" :key="m">
              <span class="credit-member__avatar">{{ m.replace('@','').slice(0,2).toUpperCase() }}</span>
              {{ m }}
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:40px; text-align:center;">
        <p style="color:var(--ink-2); font-size:14px;">Un projet indépendant, pensé et bricolé avec soin pour la communauté Minecraft francophone.</p>
      </div>
    </section>
  `,
};
