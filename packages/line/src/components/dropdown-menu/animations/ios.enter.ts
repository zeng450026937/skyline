import { Animation, createAnimation } from '@line-ui/line/src/utils/animation';

/**
 * iOS Popover Enter Animation
 */

export const iosEnterAnimation = (baseEl: HTMLElement): Animation => {
  const baseAnimation = createAnimation();
  const backdropAnimation = createAnimation();
  const wrapperAnimation = createAnimation();

  const { style } = baseEl;

  let transformY = 'translateY(-100%)';
  if (style && !style.top && style.bottom) {
    transformY = 'translateY(100%)';
  }

  backdropAnimation
    .addElement(baseEl.querySelector('.line-overlay')!)
    .fromTo('opacity', 0.01, 'var(--backdrop-opacity)');

  wrapperAnimation
    .addElement(baseEl.querySelector('.line-dropdown-menu__wrapper')!)
    .fromTo('transform', transformY, 'translateY(0%)');

  return baseAnimation
    .addElement(baseEl)
    .easing('cubic-bezier(.36,.66,.04,1)')
    .duration(400)
    .addAnimation([backdropAnimation, wrapperAnimation]);
};
