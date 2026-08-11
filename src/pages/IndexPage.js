import { ref, computed, onMounted } from "vue";
import { fetchCommands } from "../actions/bot.js";

export default {
  name: "IndexPage",
  setup() {
    const categories = ref([]);
    const loading = ref(true);
    const error = ref("");
    const query = ref("");

    onMounted(async () => {
      const result = await fetchCommands();
      loading.value = false;
      if (result.success) {
        categories.value = result.categories;
      } else {
        error.value = "Impossible de charger la liste des commandes pour l'instant.";
      }
    });

    const totalCount = computed(() => categories.value.reduce((n, c) => n + c.commands.length, 0));

    const filtered = computed(() => {
      const q = query.value.trim().toLowerCase();
      if (!q) return categories.value;
      return categories.value
        .map((c) => ({
          ...c,
          commands: c.commands.filter(
            (cmd) => cmd.name.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q)
          ),
        }))
        .filter((c) => c.commands.length);
    });

    return { loading, error, query, totalCount, filtered };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Documentation</span>
          <h2>Index des commandes</h2>
          <p v-if="!loading && !error">{{ totalCount }} commande{{ totalCount === 1 ? '' : 's' }} disponible{{ totalCount === 1 ? '' : 's' }} sur Beep.</p>
        </div>
      </div>

      <div class="field" style="max-width:360px; margin-bottom:32px;">
        <input type="text" v-model="query" placeholder="Rechercher une commande…" />
      </div>

      <p v-if="loading" class="empty">Chargement des commandes…</p>
      <p v-else-if="error" class="empty" style="color:var(--coral);">{{ error }}</p>
      <p v-else-if="!filtered.length" class="empty">Aucune commande ne correspond à « {{ query }} ».</p>

      <div v-else style="display:flex; flex-direction:column; gap:24px;">
        <div v-for="cat in filtered" :key="cat.category" class="card bracketed">
          <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:6px;">
            <h3 style="font-size:18px; text-transform:capitalize;">/{{ cat.category }}</h3>
            <span class="badge badge--brand">{{ cat.commands.length }}</span>
          </div>
          <p v-if="cat.description" style="font-size:13px; color:var(--ink-3); margin-bottom:14px;">{{ cat.description }}</p>
          <div class="command-list">
            <div class="command-row" v-for="cmd in cat.commands" :key="cmd.name">
              <code class="mono command-row__name">/{{ cmd.name }}</code>
              <span class="command-row__desc">{{ cmd.description || 'Pas de description.' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};
