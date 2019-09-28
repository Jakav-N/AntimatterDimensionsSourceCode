"use strict";

Vue.component("ra-pet-level-bar", {
  props: {
    pet: Object
  },
  data() {
    return {
      isUnlocked: false,
      level: 0,
      exp: 0,
      requiredExp: 0,
    };
  },
  computed: {
    shiftDown() {
      return ui.view.shiftDown;
    },
    importantLevels: () => [2, 3, 5, 10, 15, 25],
    unlocks() {
      return Object.values(RA_UNLOCKS).filter(unlock => unlock.pet === this.pet);
    },
    percentPerLevel() {
      return 100 / (this.currentLevelGoal - 1);
    },
    percentToNextLevel() {
      return this.exp / this.requiredExp;
    },
    multiLevelStyle() {
      return {
        width: `${Math.min((this.level - 1 + this.percentToNextLevel) * this.percentPerLevel, 100)}%`
      };
    },
    singleLevelStyle() {
      return {
        width: `${this.percentToNextLevel * 100}%`
      };
    },
    petStyle() {
      return {
        "background-color": this.pet.color
      };
    },
    importantGoal() {
      return this.importantLevels.find(goal => goal > this.level || goal === 25);
    },
    currentLevelGoal() {
      if (this.shiftDown) return this.level + 1;
      return this.importantGoal;
    },
    activeUnlock() {
      return this.unlocks.find(unlock => unlock.level === this.importantGoal);
    }
  },
  methods: {
    update() {
      const pet = this.pet;
      this.isUnlocked = pet.isUnlocked;
      if (!this.isUnlocked) return;
      this.exp = pet.exp;
      this.level = pet.level;
      this.requiredExp = pet.requiredExp;
    },
    findUnlockByLevel(level) {
      return this.unlocks.find(unlock => unlock.level === level);
    },
    isImportant(level) {
      return this.importantLevels.includes(level);
    }
  },
  template: `
    <div class="l-ra-bar-container">
      <div class="l-ra-exp-bar">
        <div v-if="shiftDown">
          <ra-level-chevron v-for="lvl in 2"
            :key="currentLevelGoal - 2 + lvl"
            :level ="currentLevelGoal - 2 + lvl"
            :goal="currentLevelGoal"
            :singleLevel="true"
            :isImportantLevel="isImportant(lvl)"
          />
        </div>
        <div v-else>
          <ra-level-chevron v-for="lvl in (currentLevelGoal - 1)"
            :key="lvl"
            :level="lvl"
            :goal="currentLevelGoal"
            :unlock="findUnlockByLevel(lvl)"
            :isImportantLevel="isImportant(lvl)"
          />
        </div>
        <div class="l-ra-exp-bar-inner" :style="[shiftDown ? singleLevelStyle : multiLevelStyle, petStyle]" />
      </div>
        <div class="l-ra-unlock" :style="petStyle">
          <div class="l-ra-unlock-inner">
            <b>{{ activeUnlock.description }}</b>
            <p>{{ activeUnlock.reward }}</p>
          </div>
        </div>
    </div>
  `
});