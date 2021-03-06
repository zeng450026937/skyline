import { VNodeDirective } from 'vue';
import { defineDirective } from '@line-ui/line/src/utils/directive';

const PADDING = 10;
const INITIAL_ORIGIN_SCALE = 0.5;

const removeRipple = (ripple: HTMLElement, effect?: HTMLElement) => {
  ripple.classList.add('fade-out');
  setTimeout(() => {
    effect && effect.remove();
    ripple.remove();
  }, 200);
};

export type RippleOption = {
  unbounded: boolean;
  delay: boolean | number;
};

export function createRippleEffect(el: HTMLElement, options: RippleOption) {
  const { unbounded = false } = options;

  const addRipple = (x: number, y: number) => {
    return new Promise<() => void>((resolve) => {
      const rect = el.getBoundingClientRect();
      const { width } = rect;
      const { height } = rect;
      const hypotenuse = Math.sqrt(width * width + height * height);
      const maxDim = Math.max(height, width);
      const maxRadius = unbounded ? maxDim : hypotenuse + PADDING;
      const initialSize = Math.floor(maxDim * INITIAL_ORIGIN_SCALE);
      const finalScale = maxRadius / initialSize;
      let posX = x - rect.left;
      let posY = y - rect.top;
      if (unbounded) {
        posX = width * 0.5;
        posY = height * 0.5;
      }
      const styleX = posX - initialSize * 0.5;
      const styleY = posY - initialSize * 0.5;
      const moveX = width * 0.5 - posX;
      const moveY = height * 0.5 - posY;

      const ripple = document.createElement('div');
      ripple.classList.add('ripple');

      const { style } = ripple;
      style.top = `${styleY}px`;
      style.left = `${styleX}px`;
      style.width = style.height = `${initialSize}px`;
      style.setProperty('--final-scale', `${finalScale}`);
      style.setProperty('--translate-end', `${moveX}px, ${moveY}px`);

      const effect = document.createElement('div');
      effect.classList.add('ripple-effect');
      if (unbounded) {
        effect.classList.add('unbounded');
      }
      effect.appendChild(ripple);

      const container = el;
      container.appendChild(effect);

      setTimeout(() => {
        resolve(() => {
          removeRipple(ripple, effect);
        });
      }, 225 + 100);
    });
  };

  el.classList.add('line-ripple-effect');

  return {
    addRipple,
    options,
  };
}

export interface RippleVNodeDirective extends VNodeDirective {
  value?: boolean;
}

function inserted(el: HTMLElement, binding: RippleVNodeDirective) {
  const { value, modifiers } = binding;

  if (value === false) return;

  (el as any).vRipple = createRippleEffect(el, modifiers as RippleOption);
}

function unbind(el: HTMLElement) {
  const { vRipple } = el as any;

  if (!vRipple) return;

  delete (el as any).vRipple;
}

function update(el: HTMLElement, binding: RippleVNodeDirective) {
  const { value, oldValue } = binding;

  if (value === oldValue) {
    return;
  }
  if (oldValue !== false) {
    unbind(el);
  }

  inserted(el, binding);
}

export const vRipple = /*#__PURE__*/ defineDirective({
  name: 'ripple',
  inserted,
  update,
  unbind,
});

export default vRipple;
