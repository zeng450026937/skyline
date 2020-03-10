import { createMixins } from 'skyline/utils/mixins';
import { useLazy } from 'skyline/mixins/use-lazy';
import { useModel } from 'skyline/mixins/use-model';
import { useRemote } from 'skyline/mixins/use-remote';
import { useTransition } from 'skyline/mixins/use-transition';
import { popupContext, PopupInterface } from 'skyline/utils/popup';
import { GESTURE_CONTROLLER } from 'skyline/utils/gesture';
import { AnimationBuilder, createAnimation } from 'skyline/utils/animation';
import { config } from 'skyline/utils/config';
import { isDef } from 'skyline/utils/helpers';

export interface PopupOptions {
  disableScroll?: boolean;
}

export function usePopup(options?: PopupOptions) {
  const { disableScroll = true } = options || {};
  let closeReason: any;
  // TODO
  // animation should move to instance
  let animation: any;

  async function animate(
    baseEl: HTMLElement,
    popup: PopupInterface,
    builder: { build: AnimationBuilder; options?: any },
  ): Promise<boolean> {
    const {
      build: animationBuilder,
      options,
    } = builder;

    animation = animationBuilder(baseEl, options);

    if (popup.transition || !config.getBoolean('animated', true)) {
      animation.duration(0);
    }

    if (popup.closeOnEscape) {
      animation.beforeAddWrite(() => {
        const activeElement = baseEl.ownerDocument!.activeElement as HTMLElement;
        if (activeElement && activeElement.matches('input, textarea')) {
          activeElement.blur();
        }
      });
    }

    await animation.play();

    animation = null;
    return true;
  }

  return createMixins({
    mixins : [
      useModel('visible'),
      useLazy('visible'),
      useRemote(),
      // Alway use transition
      // as our lifecycle event depends on it
      useTransition({ css: false }),
    ],

    props : {
      // This property holds whether the popup show the overlay.
      overlay : {
        type    : Boolean,
        default : true,
      },
      // This property holds whether the popup dims the background.
      // Unless explicitly set, this property follows the value of modal.
      dim : {
        type    : Boolean,
        default : undefined,
      },
      // This property holds whether the popup translucent the content.
      translucent : {
        type    : Boolean,
        default : false,
      },
      // This property holds whether the popup is modal.
      //
      // Modal popups often have a distinctive background dimming effect defined
      // in overlay.modal, and do not allow press or release events through to
      // items beneath them.
      //
      // On desktop platforms, it is common for modal popups
      // to be closed only when the escape key is pressed. To achieve this
      // behavior, set closePolicy to Popup.CloseOnEscape.
      modal : {
        type    : Boolean,
        default : false,
      },
      // The popup will close when the mouse is click outside of it.
      closeOnClickOutside : {
        type    : Boolean,
        default : true,
      },
      // The popup will close when the escape key is pressed while the popup has
      // active focus.
      closeOnEscape : {
        type    : Boolean,
        default : true,
      },
      activeFocus : {
        type    : Boolean,
        default : true,
      },
    },

    beforeMount() {
      // This property holds whether the popup is fully open.
      // The popup is considered opened when it's visible
      // and neither the enter nor exit transitions are running.
      this.opened = false;
      this.opening = false;
      this.closing = false;
      // Scroll blocker
      this.blocker = GESTURE_CONTROLLER.createBlocker({
        disableScroll,
      });
      // internal flag
      this.destroyWhenClose = false;

      const onBeforeEnter = () => {
        this.blocker.block();
        this.opened = false;
        this.opening = true;
        this.$emit('aboutToShow');

        popupContext.push(this as any);
      };
      const onEnter = async (el: HTMLElement, done: Function) => {
        // TODO
        // hide root element by add some classes
        //
        // Ensure element & element's child is inserted as animation may need to calc element's size
        await this.$nextTick();

        // update zIndex
        el.style.zIndex = `${ popupContext.getOverlayIndex() }`;

        const builder = {};
        this.$emit('animation-enter', builder);

        try {
          await animate(el, this as any, builder as any);
        } catch (e) {
          console.error(e);
        }

        done();
      };
      const onAfterEnter = () => {
        this.opened = true;
        this.opening = false;
        this.$emit('opened');
      };

      const onBeforeLeave = () => {
        this.$emit('aboutToHide');
        this.opened = false;
        this.closing = true;
      };
      const onLeave = async (el: HTMLElement, done: Function) => {
        const builder = {};
        this.$emit('animation-leave', builder);

        try {
          await animate(el, this as any, builder as any);
        } catch (e) {
          console.error(e);
        }

        done();
      };
      const onAfterLeave = async () => {
        this.closing = false;

        popupContext.pop(this as any);

        this.$emit('closed', closeReason);
        this.blocker.unblock();

        if (this.destroyWhenClose) {
          await this.$nextTick();
          this.$destroy();
          this.$el.remove();
        }
      };

      const onCancel = async () => {
        this.opening = false;
        this.closing = false;

        this.$emit('canceled');

        if (!animation) return;

        animation.destroy();
        animation = null;
      };

      this.$on('before-enter', onBeforeEnter);
      this.$on('after-enter', onAfterEnter);

      this.$on('before-leave', onBeforeLeave);
      this.$on('after-leave', onAfterLeave);

      this.$on('enter', onEnter);
      this.$on('enter-cancelled', onCancel);
      this.$on('leave', onLeave);
      this.$on('leave-cancelled', onCancel);

      // TODO:
      // Find some way to create overlay inside mixins
      const onClickOutside = () => {
        if (!this.closeOnClickOutside) return;
        this.visible = false;
      };
      this.$on('overlay-tap', onClickOutside);
      this.$on('clickoutside', onClickOutside);
    },

    beforeMount() {
      this.visible = this.inited = this.visible || (
        isDef(this.$attrs.visible)
          && (this.$attrs.visible as string | boolean) !== false
      );
    },

    mounted() {
      if (this.value) {
        this.open();
      }
    },

    activated() {
      if (this.value) {
        this.open();
      }
    },

    deactivated() {
      this.close();
    },

    beforeDestroy() {
      this.close();
    },

    methods : {
      open(ev?: Event) {
        if (this.$isServer) return true;
        if (this.opened) return false;

        this.event = ev;
        this.inited = true;
        this.visible = true;

        // this.blocker.block();
        return true;
      },
      close(reason?: any) {
        if (this.$isServer) return true;
        if (!this.opened) return false;

        this.visible = false;
        closeReason = reason;

        // this.blocker.unblock();
        return true;
      },
      focus() {
        // TODO
        // if modal
        // add shake animation
        const builder = {
          build : (baseEl: HTMLElement) => {
            const baseAnimation = createAnimation();
            (window as any).baseAnimation = baseAnimation;
            return baseAnimation
              .addElement(baseEl.querySelector('.line-tooltip__content')!)
              .easing('cubic-bezier(0.25, 0.8, 0.25, 1)')
              .duration(150)
              .beforeStyles({ 'transform-origin': 'center' })
              .keyframes([
                { offset: 0, transform: 'scale(1)' },
                { offset: 0.5, transform: 'scale(1.03)' },
                { offset: 1, transform: 'scale(1)' },
              ]);
          },
        };
        this.$emit('animation-focus', builder);

        animate(this.$el as HTMLElement, this as any, builder as any);

        const firstInput = this.$el.querySelector('input,button') as HTMLElement | null;
        if (firstInput) {
          firstInput.focus();
        }
      },
    },
  });
}
