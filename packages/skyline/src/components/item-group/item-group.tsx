import { createNamespace } from 'skyline/src/utils/namespace';

const { createComponent, bem } = /*#__PURE__*/ createNamespace('item-group');

export default /*#__PURE__*/ createComponent({
  render() {
    const { mode } = this;

    return (
      <div
        class={[
          bem(),
          {
            // Used internally for styling
            [`item-group-${ mode }`] : true,
            item                     : true,
          },
        ]}
      >
        {this.slots()}
      </div>
    );
  },
});
