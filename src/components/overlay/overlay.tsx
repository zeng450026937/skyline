import { createNamespace } from '@/utils/namespace';
import { now } from '@/utils/helpers';
import '@/components/overlay/overlay.scss';
import '@/components/overlay/overlay.ios.scss';

const [createComponent, bem] = createNamespace('overlay');

export default createComponent({
  props : {
    visible : {
      type    : Boolean,
      default : true,
    },
    tappable : {
      type    : Boolean,
      default : true,
    },
    stopPropagation : {
      type    : Boolean,
      default : true,
    },
  },

  created() {
    this.lastClick = -10000;
  },

  methods : {
    onTouchStart(ev: UIEvent) {
      this.emitTap(ev);
    },

    onMouseDown(ev: UIEvent) {
      if (this.lastClick < now(ev) - 1500) {
        this.emitTap(ev);
      }
    },

    emitTap(ev: UIEvent) {
      this.lastClick = now(ev);

      if (this.stopPropagation) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      if (this.tappable) {
        this.$emit('tap');
      }
    },
  },

  render() {
    return (
      <div tabindex="-1"
        class={bem({
          hide          : !this.visible,
          'no-tappable' : !this.tappable,
        })}
        on={{
          '!touchstart' : this.onTouchStart,
          '!click'      : this.onMouseDown,
          '!mousedown'  : this.onMouseDown,
        }}
      >
        {this.slots()}
      </div>
    );
  },
});