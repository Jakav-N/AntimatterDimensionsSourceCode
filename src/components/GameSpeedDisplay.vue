<script>

import SliderComponent from "@/components/SliderComponent";

export default {
  name: "GameSpeedDisplay",
  props: {
  },
  components: {
    SliderComponent
  },
  data() {
    return {
      baseSpeed: 0,
      pulsedSpeed: 0,
      hasSeenAlteredSpeed: false,
      isStopped: false,
      isEC12: false,
      isPulsing: false,
    };
  },
  computed: {
    baseSpeedText() {
      if (this.isStopped) {
        return "Stopped (storing real time)";
      }
      const speed = this.formatNumber(this.baseSpeed);
      if (this.isEC12) {
        return `${speed} (fixed)`;
      }
      return `${speed}`;
    },
    pulseSpeedText() {
      return `${this.formatNumber(this.pulsedSpeed)}`;
    },
    baseText() {
      if (!this.hasSeenAlteredSpeed) return null;
      return this.baseSpeed === 1
        ? "The game is running at normal speed."
        : `Game speed is altered: ${this.baseSpeedText}`;
    }
  },
  methods: {
    update() {
      this.baseSpeed = getGameSpeedupFactor();
      this.pulsedSpeed = getGameSpeedupForDisplay();
      this.hasSeenAlteredSpeed = PlayerProgress.seenAlteredSpeed();
      this.isStopped = Enslaved.isStoringRealTime;
      this.isEC12 = EternityChallenge(12).isRunning;
      this.isPulsing = (this.baseSpeed !== this.pulsedSpeed) && Enslaved.canRelease(true);

      this.ultraSlider = Math.log10(player.ultraSpeed);
      this.ultraSpeedImprovement = Math.pow(10, this.ultraSlider);
    },
    adjustSlider(value) {
      this.ultraSlider = value;
      player.ultraSpeed = Math.pow(10, this.ultraSlider);
      this.ultraSpeedImprovement = Math.pow(10, this.ultraSlider);
    },
    sliderProps(value) {
      return {
        min: 0,
        max: 50,
        interval: 1,
        width: "40rem",
        tooltip: false
      };
    },
    formatNumber(num) {
      if (num >= 0.001 && num < 10000 && num !== 1) {
        return format(num, 3, 3);
      }
      if (num < 0.001) {
        return `${formatInt(1)} / ${format(1 / num, 2)}`;
      }
      return `${format(num, 2)}`;
    }
  }
};
</script>

<template>
  <div>
    <span class="c-gamespeed">
      <span>
        {{ baseText }}
      </span>
      <span v-if="isPulsing">(<i class="fas fa-expand-arrows-alt u-fa-padding" /> {{ pulseSpeedText }})</span>
    </span>

    <div class="l-enslaved-shop-container">
      <div class="l-superpower-sliders">
        <b>
          Superpowers muliply real and game time speed by {{ format(ultraSpeedImprovement, 2, 2) }}.
        </b>
        <SliderComponent
          v-bind="sliderProps(true)"
          :value="ultraSlider"
          @input="adjustSlider($event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-gamespeed {
  font-weight: bold;
  color: var(--color-text);
}

.l-superpower-sliders {
  width: 40rem;
}
</style>
