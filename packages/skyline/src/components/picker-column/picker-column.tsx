import { createNamespace } from 'skyline/utils/namespace';
import { GestureDetail } from 'skyline/types/interface.d';
import { createGesture } from 'skyline/utils/gesture';

const { createComponent, bem } = /*#__PURE__*/ createNamespace('picker-column');

const clamp = (min: number, n: number, max: number) => {
  return Math.max(min, Math.min(n, max));
};

const PICKER_OPT_SELECTED = 'picker-opt-selected';
const DECELERATION_FRICTION = 0.97;
const MAX_PICKER_SPEED = 90;
const TRANSITION_DURATION = 150;

export default /*#__PURE__*/ createComponent({
  props : {
    col : Object,
  },

  data() {
    return {
      optHeight    : 0,
      rotateFactor : 0,
      scaleFactor  : 1,
      velocity     : 0,
      y            : 0,

      noAnimate : true,
    };
  },

  async mounted() {
    let pickerRotateFactor = 0;
    let pickerScaleFactor = 0.81;

    const { mode } = this;
    const { optsEl } = this.$refs;
    this.optsEl = optsEl;

    if (mode === 'ios') {
      pickerRotateFactor = -0.46;
      pickerScaleFactor = 1;
    }

    this.rotateFactor = pickerRotateFactor;
    this.scaleFactor = pickerScaleFactor;

    this.gesture = createGesture({
      el              : this.$el,
      gestureName     : 'picker-swipe',
      gesturePriority : 100,
      threshold       : 0,
      onStart         : ev => this.onStart(ev),
      onMove          : ev => this.onMove(ev),
      onEnd           : ev => this.onEnd(ev),
    });
    this.gesture.enable();
    this.tmrId = setTimeout(() => {
      this.noAnimate = false;
      this.refresh(true);
    }, 250);

    if (optsEl) {
      // DOM READ
      // We perfom a DOM read over a rendered item, this needs to happen after the first render
      this.optHeight = ((optsEl as HTMLElement).firstElementChild
        ? (optsEl as HTMLElement).firstElementChild!.clientHeight : 0);
    }

    this.refresh();
  },

  methods : {
    colChanged() {
      this.refresh();
    },

    emitColChange() {
      this.$emit('colChange', this.col);
    },

    setSelected(selectedIndex: number, duration: number) {
      // if there is a selected index, then figure out it's y position
      // if there isn't a selected index, then just use the top y position
      const y = (selectedIndex > -1) ? -(selectedIndex * this.optHeight) : 0;

      this.velocity = 0;

      // set what y position we're at
      cancelAnimationFrame(this.rafId);
      this.update(y, duration, true);

      this.emitColChange();
    },

    update(y: number, duration: number, saveY: boolean) {
      if (!this.optsEl) {
        return;
      }

      // ensure we've got a good round number :)
      let translateY = 0;
      let translateZ = 0;
      const { col, rotateFactor } = this;
      const selectedIndex = col.selectedIndex = this.indexForY(-y);
      const durationStr = (duration === 0) ? '' : `${ duration }ms`;
      const scaleStr = `scale(${ this.scaleFactor })`;

      const { children } = this.optsEl;
      for (let i = 0; i < children.length; i++) {
        const button = children[i] as HTMLElement;
        const opt = col.options[i];
        const optOffset = (i * this.optHeight) + y;
        let transform = '';

        if (rotateFactor !== 0) {
          const rotateX = optOffset * rotateFactor;
          if (Math.abs(rotateX) <= 90) {
            translateY = 0;
            translateZ = 90;
            transform = `rotateX(${ rotateX }deg) `;
          } else {
            translateY = -9999;
          }
        } else {
          translateZ = 0;
          translateY = optOffset;
        }

        const selected = selectedIndex === i;
        transform += `translate3d(0px,${ translateY }px,${ translateZ }px) `;
        if (this.scaleFactor !== 1 && !selected) {
          transform += scaleStr;
        }

        // Update transition duration
        if (this.noAnimate) {
          opt.duration = 0;
          button.style.transitionDuration = '';
        } else if (duration !== opt.duration) {
          opt.duration = duration;
          button.style.transitionDuration = durationStr;
        }

        // Update transform
        if (transform !== opt.transform) {
          opt.transform = transform;
          button.style.transform = transform;
        }
        // Update selected item
        if (selected !== opt.selected) {
          opt.selected = selected;
          if (selected) {
            button.classList.add(PICKER_OPT_SELECTED);
          } else {
            button.classList.remove(PICKER_OPT_SELECTED);
          }
        }
      }
      this.col.prevSelected = selectedIndex;

      if (saveY) {
        this.y = y;
      }

      if (this.lastIndex !== selectedIndex) {
        // have not set a last index yet
        // TODO
        // hapticSelectionChanged();
        this.lastIndex = selectedIndex;
      }
    },

    decelerate() {
      if (this.velocity !== 0) {
        // still decelerating
        this.velocity *= DECELERATION_FRICTION;

        // do not let it go slower than a velocity of 1
        this.velocity = (this.velocity > 0)
          ? Math.max(this.velocity, 1)
          : Math.min(this.velocity, -1);

        let y = this.y + this.velocity;

        if (y > this.minY) {
          // whoops, it's trying to scroll up farther than the options we have!
          y = this.minY;
          this.velocity = 0;
        } else if (y < this.maxY) {
          // gahh, it's trying to scroll down farther than we can!
          y = this.maxY;
          this.velocity = 0;
        }

        this.update(y, 0, true);
        const notLockedIn = (Math.round(y) % this.optHeight !== 0) || (Math.abs(this.velocity) > 1);
        if (notLockedIn) {
          // isn't locked in yet, keep decelerating until it is
          this.rafId = requestAnimationFrame(() => this.decelerate());
        } else {
          this.velocity = 0;
          this.emitColChange();
        }
      } else if (this.y % this.optHeight !== 0) {
        // needs to still get locked into a position so options line up
        const currentPos = Math.abs(this.y % this.optHeight);

        // create a velocity in the direction it needs to scroll
        this.velocity = (currentPos > (this.optHeight / 2) ? 1 : -1);

        this.decelerate();
      }
    },

    indexForY(y: number) {
      return Math.min(Math.max(Math.abs(Math.round(y / this.optHeight)), 0), this.col.options.length - 1);
    },

    // TODO should this check disabled?

    onStart(detail: GestureDetail) {
      // We have to prevent default in order to block scrolling under the picker
      // but we DO NOT have to stop propagation, since we still want
      // some "click" events to capture
      detail.event.preventDefault();
      detail.event.stopPropagation();

      // reset everything
      cancelAnimationFrame(this.rafId);
      const { options } = this.col;
      let minY = (options.length - 1);
      let maxY = 0;
      for (let i = 0; i < options.length; i++) {
        if (!options[i].disabled) {
          minY = Math.min(minY, i);
          maxY = Math.max(maxY, i);
        }
      }

      this.minY = -(minY * this.optHeight);
      this.maxY = -(maxY * this.optHeight);
    },

    onMove(detail: GestureDetail) {
      detail.event.preventDefault();
      detail.event.stopPropagation();

      // update the scroll position relative to pointer start position
      let y = this.y + detail.deltaY;


      if (y > this.minY) {
        // scrolling up higher than scroll area
        y **= 0.8;
        this.bounceFrom = y;
      } else if (y < this.maxY) {
        // scrolling down below scroll area
        y += (this.maxY - y) ** 0.9;
        this.bounceFrom = y;
      } else {
        this.bounceFrom = 0;
      }

      this.update(y, 0, false);
    },

    onEnd(detail: GestureDetail) {
      if (this.bounceFrom > 0) {
        // bounce back up
        this.update(this.minY, 100, true);
        this.emitColChange();
        return;
      } if (this.bounceFrom < 0) {
        // bounce back down
        this.update(this.maxY, 100, true);
        this.emitColChange();
        return;
      }

      this.velocity = clamp(-MAX_PICKER_SPEED, detail.velocityY * 23, MAX_PICKER_SPEED);
      if (this.velocity === 0 && detail.deltaY === 0) {
        const opt = (detail.event.target as Element).closest('.picker-opt');
        if (opt && opt.hasAttribute('opt-index')) {
          this.setSelected(parseInt(opt.getAttribute('opt-index') as string, 10), TRANSITION_DURATION);
        }
      } else {
        this.y += detail.deltaY;

        if (Math.abs(detail.velocityY) < 0.05) {
          const isScrollingUp = detail.deltaY > 0;
          const optHeightFraction = (Math.abs(this.y) % this.optHeight) / this.optHeight;

          if (isScrollingUp && optHeightFraction > 0.5) {
            this.velocity = Math.abs(this.velocity) * -1;
          } else if (!isScrollingUp && optHeightFraction <= 0.5) {
            this.velocity = Math.abs(this.velocity);
          }
        }

        this.decelerate();
      }
    },

    refresh(forceRefresh?: boolean) {
      let min = this.col.options.length - 1;
      let max = 0;
      const { options } = this.col;
      for (let i = 0; i < options.length; i++) {
        if (!options[i].disabled) {
          min = Math.min(min, i);
          max = Math.max(max, i);
        }
      }

      /**
       * Only update selected value if column has a
       * velocity of 0. If it does not, then the
       * column is animating might land on
       * a value different than the value at
       * selectedIndex
       */
      if (this.velocity !== 0) { return; }

      const selectedIndex = clamp(min, this.col.selectedIndex || 0, max);
      if (this.col.prevSelected !== selectedIndex || forceRefresh) {
        const y = (selectedIndex * this.optHeight) * -1;
        this.velocity = 0;
        this.update(y, TRANSITION_DURATION, true);
      }
    },
  },

  watch : {
    col() {
      this.colChanged();
    },
  },

  render() {
    const { col } = this;

    return (
      <div
        class={[
          bem(),
          {
            'picker-col'        : true,
            'picker-opts-left'  : this.col.align === 'left',
            'picker-opts-right' : this.col.align === 'right',
          },
        ]}
        style={{
          'max-width' : this.col.columnWidth,
        }}
      >
        {col.prefix && (
          <div class="picker-prefix" style={{ width: col.prefixWidth }}>
            {col.prefix}
          </div>
        )}
        <div
          class="picker-opts"
          style={{ maxWidth: col.optionsWidth }}
          ref="optsEl"
        >
          { col.options.map((o: any, index: number) => <button
              type="button"
              class={{ 'picker-opt': true, 'picker-opt-disabled': !!o.disabled }}
              opt-index={index}
            >
              {o.text}
            </button>)}
        </div>
        {col.suffix && (
          <div class="picker-suffix" style={{ width: col.suffixWidth }}>
            {col.suffix}
          </div>
        )}
      </div>
    );
  },
});