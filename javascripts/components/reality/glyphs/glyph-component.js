const GlyphTooltipEffect = {
  props: {
    effect: String,
    value: [Number, Object],
    boostColor: String,
  },
  computed: {
    effectConfig() {
      return GameDatabase.reality.glyphEffects[this.effect];
    },
    prefix() {
      return this.effectConfig.singleDescSplit[0].replace("\n", "<br>");
    },
    suffix() {
      return this.effectConfig.singleDescSplit[1].replace("\n", "<br>");
    },
    displayValue() {
      let value = this.effectConfig.formatEffect(this.value);
      return this.boostColor ? `⯅${value}⯅` : value;
    },
    valueStyle() {
      return this.boostColor ? {
        color: this.boostColor,
        "text-shadow": `0 0 0.4rem ${this.boostColor}`
      } : {
          color: "#76EE76",
        }
    }
  },
  template: /*html*/`
    <div class="c-glyph-tooltip__effect">
      <span v-html="prefix"/>
      <span :style="valueStyle">{{displayValue}}</span>
      <span v-html="suffix"/>
    </div>
    `
};

const GlyphTooltipComponent = {
  components: {
    "effect-desc": GlyphTooltipEffect,
  },
  props: {
    type: String,
    strength: Number,
    level: Number,
    effects: Object,
    id: Number,
    sacrificeReward: {
      type: Number,
      default: 0,
    },
    effectiveLevel: {
      type: Number,
      default: 0,
    }
  },
  computed: {
    onTouchDevice() {
      return GameUI.touchDevice;
    },
    sortedEffects() {
      return Object.keys(this.effects).map(e => ({
        id: this.type + e,
        value: this.effects[e],
      })).sort((a, b) => GlyphEffectOrder[a.id] - GlyphEffectOrder[b.id]);
    },
    rarityInfo() {
      return getRarity(this.strength);
    },
    descriptionStyle() {
      return {
        color: this.rarityInfo.color,
        "text-shadow": `-1px 1px 1px black, 1px 1px 1px black,
                        -1px -1px 1px black, 1px -1px 1px black, 0 0 3px ${this.rarityInfo.color}`,
        float: "left"
      }
    },
    description() {
      return `${this.rarityInfo.name} glyph of ${this.type} (${strengthToRarity(this.strength).toFixed(1)}%)`;
    },
    isLevelCapped() {
      return this.level == this.effectiveLevel
    },
    levelText() {
      return this.isLevelCapped
        ? `Level: ${this.level}`
        : `Level: ▼${this.effectiveLevel}▼`;
    },
    levelStyle() {
      return { color: this.isLevelCapped ? "#FFFFFF" : "#FF1111" }
    },
    sacrificeText() {
      return this.onTouchDevice
        ? `Sacrifice for ${shorten(this.sacrificeReward, 2, 2)} power`
        : `Can be sacrificed for ${shorten(this.sacrificeReward, 2, 2)} power`;
    },
    eventHandlers() {
      return GameUI.touchDevice ? {
        touchstart: this.touchStart,
        dragstart: this.dragStart,
        dragEnd: this.dragEnd,
      } : {};
    },
    pointerEventStyle() {
      // With computer mice, it's nice to just totally disable mouse events on the tooltip,
      // which reduces the chances for stupidity
      return this.onTouchDevice ? {} : { "pointer-events": "none" };
    }
  },
  methods: {
    touchStart() {
      // We _don't_ preventDefault here because we want the event to turn into a local
      // dragstart that we can intercept
      this.$parent.$emit("tooltip-touched");
    },
    dragStart(ev) {
      // Prevent dragging by tooltip on mobile
      ev.preventDefault();
      ev.stopPropagation();
    },
    dragEnd(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    },
    sacrificeGlyph() {
      sacrificeGlyph(Glyphs.findById(this.id), false);
    },
  },
  template: /*html*/`
  <div class="l-glyph-tooltip c-glyph-tooltip"
       :style="pointerEventStyle"
       v-on="eventHandlers">
    <div class="l-glyph-tooltip__header">
      <span class="c-glyph-tooltip__description"
            :style="descriptionStyle">{{description}}</span>
      <span class="l-glyph-tooltip__level" :style="levelStyle">{{levelText}}</span>
    </div>
    <div class="l-glyph-tooltip__effects">
      <effect-desc v-for="e in sortedEffects"
                   :key="e.id"
                   :effect="e.id"
                   :value="e.value"/>
    </div>
    <div v-if="sacrificeReward > 0"
         :class="['c-glyph-tooltip__sacrifice', {'c-glyph-tooltip__sacrifice--touchable': onTouchDevice}]"
         v-on="onTouchDevice ? { click: sacrificeGlyph } : {}">
      {{sacrificeText}}
    </div>
  </div>
  `,
};

Vue.component("glyph-component", {
  components: {
    "glyph-tooltip": GlyphTooltipComponent,
  },
  props: {
    glyph: Object,
    showSacrifice: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: "5rem",
    },
    glowBlur: {
      type: String,
      default: "1rem"
    },
    glowSpread: {
      type: String,
      default: "0.2rem"
    },
    textProportion: {
      type: Number,
      default: 0.5
    },
    circular: {
      type: Boolean,
      default: false,
    },
    draggable: {
      type: Boolean,
      default: false,
    }
  },
  data: function () {
    return {
      componentID: UIID.next(),
      isDragging: false,
      // This flag is used to prevent the tooltip from being shown in some touch event sequences
      suppressTooltip: false,
      isTouched: false,
      sacrificeReward: 0,
      effectiveLevel: 0,
    }
  },
  computed: {
    hasTooltip() {
      return this.glyph.effects !== undefined;
    },
    typeConfig() {
      return GlyphTypes[this.glyph.type];
    },
    symbol() {
      const symbol = this.glyph.symbol;
      return symbol
        ? (symbol.startsWith("key") ? specialGlyphSymbols[symbol] : symbol)
        : this.typeConfig.symbol;
    },
    borderColor() {
      return this.glyph.color || this.typeConfig.color;
    },
    overStyle() {
      return {
        width: this.size,
        height: this.size,
        position: "absolute",
        "background-color": "rgba(0, 0, 0, 0)",
        "box-shadow": `0 0 ${this.glowBlur} calc(${this.glowSpread} + 0.1rem) ${this.borderColor} inset`,
        "border-radius": this.circular ? "50%" : "0",
      }
    },
    outerStyle() {
      return {
        width: this.size,
        height: this.size,
        "background-color": this.borderColor,
        "box-shadow": `0 0 ${this.glowBlur} ${this.glowSpread} ${this.borderColor}`,
        "border-radius": this.circular ? "50%" : "0",
      }
    },
    innerStyle() {
      const rarityColor = this.glyph.color ||
        GlyphRarities.find(e => this.glyph.strength >= e.minStrength).color;
      return {
        width: `calc(${this.size} - 0.2rem)`,
        height: `calc(${this.size} - 0.2rem)`,
        "font-size": `calc( ${this.size} * ${this.textProportion} )`,
        color: rarityColor,
        "text-shadow": `-0.04em 0.04em 0.08em ${rarityColor}`,
        "border-radius": this.circular ? "50%" : "0",
      }
    },
    mouseEventHandlers() {
      let ret = this.hasTooltip ? {
        mouseenter: this.mouseEnter,
        "&mousemove": this.mouseMove,
        mouseleave: this.mouseLeave,
        mousedown: this.mouseDown,
        touchstart: this.touchStart,
        touchend: this.touchEnd
      } : {};
      if (this.hasTooltip || this.draggable) {
        ret.touchmove = this.touchMove;
      }
      return ret;
    },
    isCurrentTooltip() {
      return this.$viewModel.tabs.reality.currentGlyphTooltip === this.componentID;
    },
  },
  created() {
    this.$on("tooltip-touched", () => this.hideTooltip() );
  },
  beforeDestroy() {
    if (this.isCurrentTooltip) this.hideTooltip();
    if (this.$viewModel.draggingUIID === this.componentID) this.$viewModel.draggingUIID = -1;
  },
  methods: {
    hideTooltip() {
      this.$viewModel.tabs.reality.currentGlyphTooltip = -1;
    },
    showTooltip() {
      this.$viewModel.tabs.reality.currentGlyphTooltip = this.componentID;
      this.sacrificeReward = glyphSacrificeGain(this.glyph);
      this.effectiveLevel = (Effarig.isRunning && this.glyph.level > Effarig.glyphLevelCap) ? Effarig.glyphLevelCap : this.glyph.level;
    },
    moveTooltipTo(x, y) {
      const tooltipEl = this.$refs.tooltip.$el;
      if (tooltipEl) {
        const rect = this.$el.getBoundingClientRect();
        tooltipEl.style.left = `${x - rect.left}px`
        tooltipEl.style.top = `${y - rect.top}px`
      }
    },
    mouseEnter() {
      if (this.$viewModel.draggingUIID !== -1) return;
      this.showTooltip();
    },
    mouseLeave() {
      if (this.isCurrentTooltip) {
        this.hideTooltip();
      }
    },
    mouseDown() {
      if (this.isTouched) return;
      this.hideTooltip();
    },
    mouseMove(ev) {
      if (this.isTouched) return;
      this.moveTooltipTo(ev.clientX, ev.clientY);
    },
    dragStart(ev) {
      this.hideTooltip();
      this.isDragging = true;
      this.suppressTooltip = true;
      ev.dataTransfer.setData(GLYPH_MIME_TYPE, this.glyph.id.toString());
      ev.dataTransfer.dropEffect = "move";
      this.$viewModel.draggingUIID = this.componentID;
      const rect = this.$refs.over.getBoundingClientRect();
      ev.dataTransfer.setDragImage(this.$refs.over, ev.clientX-rect.left, ev.clientY-rect.top);
    },
    dragEnd() {
      this.isDragging = false;
      this.suppressTooltip = false;
      this.$viewModel.scrollWindow = 0;
      if (this.$viewModel.draggingUIID === this.componentID) this.$viewModel.draggingUIID = -1;
    },
    drag(ev) {
      // It looks like dragging off the bottom of the window sometimes fires these
      // odd events
      if (ev.screenX === 0 && ev.screenY === 0) {
        this.$viewModel.scrollWindow = 0;
        return;
      }
      const boundary = 100;
      if (ev.clientY < boundary) {
        this.$viewModel.scrollWindow = -1 + 0.9 * ev.clientY/boundary;
      } else if (ev.clientY > $(window).height() - boundary) {
        this.$viewModel.scrollWindow = 1 - 0.9 * ($(window).height() - ev.clientY) / boundary;
      } else {
        this.$viewModel.scrollWindow = 0;
      }
    },
    touchStart() {
      this.isTouched = true;
    },
    touchEnd(e) {
      if (this.isCurrentTooltip) {
        e.preventDefault();
        this.hideTooltip();
      } else if (!this.suppressTooltip) {
        e.preventDefault();
        this.showTooltip();
        this.moveTooltipTo(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      this.suppressTooltip = false;
      this.isTouched = false;
    },
    touchMove(e) {
      const t = e.changedTouches[0];
      const r = this.$refs.over.getBoundingClientRect();
      if (t.clientX < r.left || t.clientY < r.top || t.clientX > r.left + r.width || t.clientY > r.top + r.height) {
        this.suppressTooltip = true;
      }
      if (this.isDragging) {
        // DragDropTouch doesn't seem to send drag events.
        this.drag(t);
      }
    },
  },
  template:  /*html*/`
  <!-- The naive approach with a border and box-shadow seems to have problems with
      weird seams/artifacts at the edges. This makes for a rather complex workaround -->
    <div :style="outerStyle"
         :class="['l-glyph-component', {'c-glyph-component--dragging': isDragging}]"
         :draggable="draggable"
         v-on="draggable ? { dragstart: dragStart,
                             dragend: dragEnd,
                             drag: drag } : {}">
      <div ref="glyph"
           :style="innerStyle"
           :class="['l-glyph-component', 'c-glyph-component']">
        {{symbol}}
        <glyph-tooltip v-if="hasTooltip"
                       v-show="isCurrentTooltip"
                       ref="tooltip"
                       v-bind="glyph"
                       :sacrificeReward="sacrificeReward"
                       :effectiveLevel="effectiveLevel"
                       :visible="isCurrentTooltip"/>
      </div>
      <div ref="over"
           :style="overStyle"
           v-on="mouseEventHandlers"
           @click.shift.exact="$emit('shiftClicked', glyph.id)"
           @click.ctrl.shift.exact="$emit('ctrlShiftClicked', glyph.id)"
           @click.meta.shift.exact="$emit('ctrlShiftClicked', glyph.id)"
           @click.exact="$emit('clicked', glyph.id)"/>
    </div>
  `,
});