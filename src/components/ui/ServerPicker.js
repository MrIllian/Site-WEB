import { ref } from "vue";

export default {
  name: "ServerPicker",
  props: {
    servers: { type: Array, required: true },
    modelValue: { type: String, default: null },
    placeholder: { type: String, default: "Choisir un serveur" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const open = ref(false);
    function select(id) {
      emit("update:modelValue", id);
      open.value = false;
    }
    return { open, select };
  },
  computed: {
    current() {
      return this.servers.find((s) => s.id === this.modelValue) || null;
    },
  },
  template: /* html */ `
    <div class="server-picker" :class="{ 'is-open': open }" v-click-outside="() => open = false">
      <button type="button" class="server-picker__trigger" @click="open = !open">
        <span class="server-picker__icon">{{ current ? current.name.slice(0,2).toUpperCase() : '—' }}</span>
        <span class="server-picker__meta">
          <span class="server-picker__name">{{ current ? current.name : placeholder }}</span>
          <span class="server-picker__sub" v-if="current">{{ current.ip }}</span>
        </span>
        <span class="server-picker__caret"></span>
      </button>
      <div v-if="open" class="server-picker__menu">
        <button
          v-for="s in servers"
          :key="s.id"
          type="button"
          class="server-picker__item"
          :class="{ 'is-active': s.id === modelValue }"
          @click="select(s.id)"
        >
          <span class="server-picker__icon" style="width:24px;height:24px;font-size:11px;">{{ s.name.slice(0,2).toUpperCase() }}</span>
          {{ s.name }}
        </button>
        <div v-if="!servers.length" class="empty">Aucun serveur disponible</div>
      </div>
    </div>
  `,
};
