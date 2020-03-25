import { createNamespace } from 'skyline/src/utils/namespace';
import { createColorClasses } from 'skyline/src/mixins/use-color';

const { createComponent, bem } = /*#__PURE__*/ createNamespace('card-header');

export default /*#__PURE__*/ createComponent({
  functional : true,

  props : {
    color       : String,
    translucent : Boolean,
  },

  render(h, { props, data, slots }) {
    const { color, translucent } = props;
    return (
      <div
        class={[
          bem({ translucent }),
          createColorClasses(color),
          'line-inherit-color',
        ]}
        {...data}
      >
        {slots()}
      </div>
    );
  },
});
