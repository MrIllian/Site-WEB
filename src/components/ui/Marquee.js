export default {
  name: "Marquee",
  props: {
    items: { type: Array, required: true },
  },
  template: /* html */ `
    <div class="marquee">
      <div class="marquee__track">
        <span class="marquee__item" v-for="(t, i) in items" :key="'a'+i">
          <span class="dot" style="color:var(--lime)"></span>{{ t }}
        </span>
        <span class="marquee__item" v-for="(t, i) in items" :key="'b'+i">
          <span class="dot" style="color:var(--lime)"></span>{{ t }}
        </span>
      </div>
    </div>
  `,
};
