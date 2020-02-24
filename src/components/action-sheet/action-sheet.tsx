import { createNamespace } from '@/utils/namespace';
import { usePopup } from '@/mixins/use-popup';
import { Overlay } from '@/components/overlay';
import '@/components/action-sheet/action-sheet.ios.scss';
import '@/components/action-sheet/action-sheet.scss';
// import {
//   BACKDROP, dismiss, eventMethod, isCancel, prepareOverlay, present, safeCall,
// } from '@/utils/overlays';

import { iosEnterAnimation } from '@/components/action-sheet/animations/ios.enter';
import { iosLeaveAnimation } from '@/components/action-sheet/animations/ios.leave';
import { mdEnterAnimation } from '@/components/action-sheet/animations/md.enter';
import { mdLeaveAnimation } from '@/components/action-sheet/animations/md.leave';
import { ActionSheetButton } from '@/components/action-sheet/action-sheet-interface';

const [createComponent, bem] = createNamespace('action-sheet');

export default createComponent({
  mixins : [usePopup()],

  props : {
    header    : String,
    subHeader : String,
    actions   : {
      type    : Array,
      default : [],
    },
  },

  computed : {
    normalizedActions(): ActionSheetButton[] {
      const { actions } = this as { actions: (ActionSheetButton | string)[]; };
      return actions.map(action => {
        return (typeof action === 'string')
          ? { text: action }
          : action;
      });
    },

    optionActions(): ActionSheetButton[] {
      return this.normalizedActions.filter(action => action.role !== 'cancel');
    },

    cancelAction(): ActionSheetButton | undefined {
      return this.normalizedActions.find(action => action.role === 'cancel');
    },
  },

  created() {
    this.$on('animation-enter', (builder: any) => {
      builder.build = iosEnterAnimation;
    });
    this.$on('animation-leave', (builder: any) => {
      builder.build = iosLeaveAnimation;
    });
  },

  methods : {
    onTap() {
      this.$emit('overlay-tap');
    },

    isCancel(role) {
      return role === 'cancel';
    },

    async buttonClick(button: ActionSheetButton) {
      const { role } = button;
      if (this.isCancel(role)) {
        return this.dismiss(undefined, role);
      }
      // const shouldDismiss = await this.callButtonHandler(button);
      // if (shouldDismiss) {
      //   return this.dismiss(undefined, button.role);
      // }
      return Promise.resolve();
    },

    // async callButtonHandler(button: ActionSheetButton | undefined) {
    //   if (button) {
    //     // a handler has been provided, execute it
    //     // pass the handler the values from the inputs
    //     const rtn = await safeCall(button.handler);
    //     if (rtn === false) {
    //       // if the return value of the handler is false then do not dismiss
    //       return false;
    //     }
    //   }
    //   return true;
    // },
  },

  render() {
    const { optionActions, cancelAction } = this;

    return (
      <div
        v-show={this.visible}
        role="dialog"
        aria-modal="true"
        class={bem({
          translucent : this.translucent,
        })}
      >
        <Overlay
          visible={this.dim}
          onTap={this.onTap}
        >
        </Overlay>

        <div
          role="dialog"
          class={bem('wrapper')}
        >
          <div class={bem('container')}>
            <div class={bem('group')}>
              {
                this.header && (
                  <div class={bem('title')}>
                    {this.header}
                    {
                      this.subHeader && (
                        <div class={bem('sub-title')}>
                          {this.subHeader}
                        </div>
                      )
                    }
                  </div>
                )
              }

              {
                optionActions.map((action) => (
                  <button
                    type="button"
                    class={[
                      bem('button', { [`${ action.role }`]: !!action.role }),
                      'line-activatable',
                    ]}
                  >
                    <span class={bem('button-inner')}>
                      {action.text}
                    </span>
                  </button>
                ))
              }
            </div>

            {
              cancelAction && (
                <div class={bem('group', { cancel: true })}>
                  <button
                    type="button"
                    class={[
                      bem('button', { [`${ cancelAction.role }`]: !!cancelAction.role }),
                      'line-activatable',
                    ]}
                  >
                    <span class={bem('button-inner')}>
                      {cancelAction.text}
                    </span>
                  </button>
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  },
});
