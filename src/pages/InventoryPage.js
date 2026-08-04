import { ref, computed } from "vue";
import { auth, authActions } from "../store/auth.js";
import { servers } from "../data/servers.js";
import { inventoryByServer } from "../data/inventory.js";
import ServerPicker from "../components/ui/ServerPicker.js";

export default {
  name: "InventoryPage",
  components: { ServerPicker },
  setup() {
    const invServerIds = Object.keys(inventoryByServer);
    const availableServers = computed(() => servers.filter((s) => invServerIds.includes(s.id)));
    const selectedId = ref(availableServers.value[0]?.id || null);
    const inventory = computed(() => inventoryByServer[selectedId.value] || { roles: [], blocks: [], items: [] });

    return { auth, authActions, availableServers, selectedId, inventory };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div v-if="!auth.isAuthenticated" class="auth-gate" style="max-width:520px; margin-inline:auto; margin-top:40px;">
        <span class="eyebrow">Inventaire</span>
        <h2 style="font-size:24px;">Connectez-vous pour voir votre inventaire</h2>
        <p style="color:var(--ink-2); font-size:14px;">Beep récupère vos rôles, blocs et objets pour chaque serveur une fois connecté.</p>
        <button class="btn btn--discord" :disabled="auth.isLoading" @click="authActions.login">
          {{ auth.isLoading ? 'Connexion…' : 'Se connecter avec Discord' }}
        </button>
      </div>

      <template v-else>
        <div class="section-head">
          <div>
            <span class="eyebrow" style="margin-bottom:10px;">Votre profil de jeu</span>
            <h2>Inventaire</h2>
            <p>Rôles, ressources et objets suivis par Beep sur le serveur sélectionné.</p>
          </div>
        </div>

        <div style="max-width:360px; margin-bottom:32px;">
          <ServerPicker v-model="selectedId" :servers="availableServers" placeholder="Choisir un serveur" />
        </div>

        <div v-if="!availableServers.length" class="empty">Beep n'a pas encore d'inventaire suivi pour vous sur un serveur.</div>

        <template v-else>
          <div class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Rôles</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <span v-for="r in inventory.roles" :key="r.id" class="badge" :style="{ color: r.color, borderColor: r.color + '55', background: r.color + '14' }">{{ r.name }}</span>
              <span v-if="!inventory.roles.length" class="empty" style="padding:0;">Aucun rôle sur ce serveur.</span>
            </div>
          </div>

          <div class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Blocs & ressources</span>
            <div class="inv-grid">
              <div class="inv-tile" v-for="b in inventory.blocks" :key="b.id">
                <span class="inv-tile__icon">{{ b.icon }}</span>
                <span>{{ b.name }}</span>
                <span class="inv-tile__qty">×{{ b.qty.toLocaleString('fr-FR') }}</span>
              </div>
            </div>
            <div v-if="!inventory.blocks.length" class="empty">Aucune ressource suivie.</div>
          </div>

          <div class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Objets</span>
            <div class="inv-grid">
              <div class="inv-tile" v-for="it in inventory.items" :key="it.id">
                <span class="inv-tile__icon">{{ it.icon }}</span>
                <span>{{ it.name }}</span>
                <span class="inv-tile__qty">×{{ it.qty }}</span>
              </div>
            </div>
            <div v-if="!inventory.items.length" class="empty">Aucun objet suivi.</div>
          </div>
        </template>
      </template>
    </section>
  `,
};
