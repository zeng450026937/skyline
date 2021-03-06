import { createNamespace } from '@line-ui/line/src/utils/namespace';
import { ActionSheetButtonOption } from '@line-ui/line/src/components/action-sheet/action-sheet-interface';
import { safeCall } from '@line-ui/line/src/utils/helpers';

const { createComponent, bem } = /*#__PURE__*/ createNamespace(
  'combo-box-item'
);

export default /*#__PURE__*/ createComponent({
  props: {
    option: Object,
  },

  methods: {
    async buttonClick(button: ActionSheetButtonOption) {
      const parent =
        this.$parent.$options.name === 'line-combo-box' ? this.$parent : null;

      if (!parent) return;

      if (!button) {
        return parent.close();
      }

      const { role } = button;

      if (role === 'cancel') {
        return parent.close();
      }

      const shouldClose = await this.callButtonHandler(button);
      if (shouldClose) {
        parent.$emit('optionChange', button);
        return parent.close();
      }

      return Promise.resolve();
    },

    async callButtonHandler(button: ActionSheetButtonOption | undefined) {
      if (button) {
        // a handler has been provided, execute it
        // pass the handler the values from the inputs
        try {
          const rtn = await safeCall(button.handler);
          if (rtn === false) {
            // if the return value of the handler is false then do not dismiss
            return false;
          }
        } catch (error) {
          __DEV__ && console.error(error);
        }
      }

      return true;
    },
  },

  render() {
    const { option = {} } = this;

    return (
      <li
        class={[bem(''), 'line-activatable']}
        onClick={() => this.buttonClick(option)}
      >
        <span class={bem('inner')}>{this.slots() || option.text}</span>
      </li>
    );
  },
});
