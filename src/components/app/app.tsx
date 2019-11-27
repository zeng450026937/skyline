import { createNamespace } from '@/utils/namespace';
import { setupPlatforms } from '@/utils/platform';
import { setupConfig } from '@/utils/config';
import { setupTapClick } from '@/utils/tap-click';
import { setupFocusVisible } from '@/utils/focus-visible';
import { setupPopup } from '@/utils/popup';

const [createComponent, bem] = createNamespace('app');

export default createComponent({
  props : {
    id : {
      type    : String,
      default : 'app',
    },
  },

  provide() {
    return {
      App : this,
    };
  },

  created() {
    // TODO:
    // config must be setup before using
    // child content is rendered before created
    setupPlatforms();
    setupConfig();
    setupTapClick();
    setupFocusVisible();
    setupPopup();
  },

  render() {
    return (
      <div id={this.id} skyline-app class={[bem(), 'ion-page']}>
        {this.slots()}
      </div>
    );
  },
});