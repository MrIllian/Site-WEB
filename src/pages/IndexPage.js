import { ref, computed, onMounted } from "vue";
import { fetchCommands, fetchSystems } from "../actions/bot.js";
import { useAutoRefresh } from "../lib/useAutoRefresh.js";

const VIEWS = [
  { id: "systems", label: "Fonctionnalités" },
  { id: "commands", label: "Toutes les commandes" },
];

// États gérés par le staff avec /systeme modifier (SYSTEM_STATUS_LEVELS).
function statusClass(status) {
  if (status === "operationnel") return "status-pill--online";
  if (status === "non-operationnel") return "status-pill--offline";
  if (status === "inconnu") return "";
  return "status-pill--degraded";
}

export default {
  name: "IndexPage",
  setup() {
    const categories = ref([]);
    const systems = ref([]);
    const loading = ref(true);
    const error = ref("");
    const query = ref("");
    const view = ref("systems");

    async function load() {
      const [cmds, sys] = await Promise.all([fetchCommands(), fetchSystems()]);
      loading.value = false;
      if (cmds.success) categories.value = cmds.categories;
      if (sys.success) systems.value = sys.systems;
      error.value = cmds.success || sys.success ? "" : "Impossible de charger l'index pour l'instant.";
    }

    onMounted(load);
    useAutoRefresh(load);

    const totalCount = computed(() => categories.value.reduce((n, c) => n + c.commands.length, 0));
    const notOperational = computed(() => systems.value.filter((s) => s.status !== "operationnel").length);

    const q = computed(() => query.value.trim().toLowerCase());

    const filteredSystems = computed(() => {
      if (!q.value) return systems.value;
      return systems.value.filter((s) =>
        [s.name, s.description, ...s.commands].some((t) => t.toLowerCase().includes(q.value))
      );
    });

    const filteredCategories = computed(() => {
      if (!q.value) return categories.value;
      return categories.value
        .map((c) => ({
          ...c,
          commands: c.commands.filter((cmd) =>
            ("/" + cmd.name).toLowerCase().includes(q.value) || cmd.description.toLowerCase().includes(q.value)
          ),
        }))
        .filter((c) => c.commands.length);
    });

    // Clic sur une commande d'une fonctionnalité → son détail (paramètres).
    function showCommand(name) {
      query.value = name;
      view.value = "commands";
    }

    function usage(cmd) {
      const opts = (cmd.options || []).map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`));
      return ["/" + cmd.name, ...opts].join(" ");
    }

    return {
      VIEWS, view, loading, error, query, totalCount, notOperational, systems,
      filteredSystems, filteredCategories, showCommand, usage, statusClass,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Documentation</span>
          <h2>Index des commandes</h2>
          <p v-if="!loading && !error">
            {{ systems.length }} fonctionnalités · {{ totalCount }} commande{{ totalCount === 1 ? '' : 's' }} disponible{{ totalCount === 1 ? '' : 's' }} sur Beep
            <template v-if="notOperational"> · {{ notOperational }} fonctionnalité{{ notOperational === 1 ? '' : 's' }} pas entièrement opérationnelle{{ notOperational === 1 ? '' : 's' }}</template>.
          </p>
        </div>
      </div>

      <div class="shop-toolbar">
        <div class="field" style="width:360px; max-width:100%;">
          <input type="text" v-model="query" placeholder="Rechercher… (ex. shop, /ip)" />
        </div>
        <div class="market-filters" style="margin-bottom:0;">
          <button v-for="v in VIEWS" :key="v.id" :class="{ 'is-active': view === v.id }" @click="view = v.id">{{ v.label }}</button>
        </div>
      </div>

      <p v-if="loading" class="empty">Chargement de l'index…</p>
      <p v-else-if="error" class="empty" style="color:var(--coral);">{{ error }}</p>

      <template v-else-if="view === 'systems'">
        <p v-if="!filteredSystems.length" class="empty">Aucune fonctionnalité ne correspond à « {{ query }} ».</p>
        <div v-else class="systems-grid">
          <div v-for="s in filteredSystems" :key="s.key" class="card system-card">
            <div class="system-card__head">
              <h3 class="system-card__name">{{ s.name }}</h3>
              <span class="status-pill" :class="statusClass(s.status)"><span class="dot"></span>{{ s.statusLabel }}</span>
            </div>
            <p class="system-card__desc">{{ s.description }}</p>
            <div v-if="s.commands.length" class="system-card__cmds">
              <button v-for="c in s.commands" :key="c" type="button" class="tag mono system-card__cmd" @click="showCommand(c)">{{ c }}</button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <p v-if="!filteredCategories.length" class="empty">Aucune commande ne correspond à « {{ query }} ».</p>
        <div v-else style="display:flex; flex-direction:column; gap:24px;">
          <div v-for="cat in filteredCategories" :key="cat.category" class="card bracketed">
            <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:6px;">
              <h3 style="font-size:18px; text-transform:capitalize;">/{{ cat.category }}</h3>
              <span class="badge badge--brand">{{ cat.commands.length }}</span>
            </div>
            <p v-if="cat.description" style="font-size:13px; color:var(--ink-3); margin-bottom:14px;">{{ cat.description }}</p>
            <div class="command-list">
              <div class="command-row" v-for="cmd in cat.commands" :key="cmd.name">
                <code class="mono command-row__name">{{ usage(cmd) }}</code>
                <span class="command-row__desc">
                  {{ cmd.description || 'Pas de description.' }}
                  <span v-if="cmd.adminOnly" class="badge badge--coral" style="margin-left:6px;">Admin</span>
                  <span v-if="cmd.options && cmd.options.length" class="command-row__opts">
                    <span v-for="o in cmd.options" :key="o.name">
                      <span class="mono">{{ o.name }}</span>{{ o.required ? '' : ' (optionnel)' }}<template v-if="o.description"> — {{ o.description }}</template>
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  `,
};
