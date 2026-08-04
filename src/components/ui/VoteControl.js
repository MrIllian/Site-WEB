export default {
  name: "VoteControl",
  props: {
    upvotes: { type: Number, required: true },
    downvotes: { type: Number, required: true },
    userVote: { type: Number, default: 0 }, // -1, 0, 1
    disabled: { type: Boolean, default: false },
  },
  emits: ["vote"],
  computed: {
    score() {
      return this.upvotes - this.downvotes;
    },
  },
  template: /* html */ `
    <div class="vote">
      <button
        type="button"
        class="vote__btn is-up"
        :class="{ 'is-active': userVote === 1 }"
        :disabled="disabled"
        :title="disabled ? 'Connectez-vous pour voter' : 'Voter pour'"
        @click="$emit('vote', 1)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 4l8 9h-5v7H9v-7H4l8-9Z" fill="currentColor"/></svg>
      </button>
      <span class="vote__score">{{ score }}</span>
      <button
        type="button"
        class="vote__btn is-down"
        :class="{ 'is-active': userVote === -1 }"
        :disabled="disabled"
        :title="disabled ? 'Connectez-vous pour voter' : 'Voter contre'"
        @click="$emit('vote', -1)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 20l-8-9h5V4h6v7h5l-8 9Z" fill="currentColor"/></svg>
      </button>
    </div>
  `,
};
