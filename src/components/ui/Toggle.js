export default {
  name: "Toggle",
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  template: /* html */ `
    <label class="toggle">
      <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        class="toggle__track"
        :class="{ 'is-on': modelValue }"
        @click="$emit('update:modelValue', !modelValue)"
      >
        <span class="toggle__thumb"></span>
      </button>
      <span v-if="label" class="mono" style="font-size:13px;color:var(--ink-2)">{{ label }}</span>
    </label>
  `,
};
