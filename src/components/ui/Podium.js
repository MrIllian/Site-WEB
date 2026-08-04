export default {
  name: "Podium",
  props: {
    top3: { type: Array, required: true }, // [1st, 2nd, 3rd]
  },
  template: /* html */ `
    <div class="podium" v-if="top3.length">
      <div class="podium__slot podium__slot--2" v-if="top3[1]">
        <div class="podium__avatar">{{ top3[1].name.slice(0,2).toUpperCase() }}</div>
        <div class="podium__name">{{ top3[1].name }}</div>
        <div class="podium__score mono">{{ top3[1].upvotes - top3[1].downvotes }} pts</div>
        <div class="podium__bar">2</div>
      </div>
      <div class="podium__slot podium__slot--1" v-if="top3[0]">
        <div class="podium__avatar">{{ top3[0].name.slice(0,2).toUpperCase() }}</div>
        <div class="podium__name">{{ top3[0].name }}</div>
        <div class="podium__score mono">{{ top3[0].upvotes - top3[0].downvotes }} pts</div>
        <div class="podium__bar">1</div>
      </div>
      <div class="podium__slot podium__slot--3" v-if="top3[2]">
        <div class="podium__avatar">{{ top3[2].name.slice(0,2).toUpperCase() }}</div>
        <div class="podium__name">{{ top3[2].name }}</div>
        <div class="podium__score mono">{{ top3[2].upvotes - top3[2].downvotes }} pts</div>
        <div class="podium__bar">3</div>
      </div>
    </div>
  `,
};
