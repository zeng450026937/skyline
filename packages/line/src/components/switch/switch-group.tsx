import { useGroup } from '@line-ui/line/src/mixins/use-group';
import { createNamespace } from '@line-ui/line/src/utils/namespace';

const NAMESPACE = 'SwitchGroup';
const { createComponent, bem } = /*#__PURE__*/ createNamespace('switch-group');

export default /*#__PURE__*/ createComponent({
  mixins: [/*#__PURE__*/ useGroup(NAMESPACE)],

  render() {
    return <div class={bem()}>{this.slots()}</div>;
  },
});
