import { createNamespace } from 'skyline/utils/namespace';
import { useColor } from 'skyline/mixins/use-color';
import { isDef } from 'skyline/utils/helpers';

const { createComponent, bem } = /*#__PURE__*/ createNamespace('title');

export default /*#__PURE__*/ createComponent({
  mixins : [
    /*#__PURE__*/ useColor(),
  ],

  props : {
    // large | small | default
    size : String,
  },

  render() {
    const { size } = this;
    return (
      <div
        class={bem({
          [size] : isDef(size),
        })}
        on={this.$listeners}
      >
        <div class={bem('inner')}>
          {this.slots()}
        </div>
      </div>
    );
  },
});
