import { DirectiveOptions, VNodeDirective } from 'vue';
import { off, on } from 'skyline/utils/dom';
import { keys } from 'skyline/utils/helpers';

export interface TouchStoredHandlers {
  touchstart: (e: TouchEvent) => void;
  touchend: (e: TouchEvent) => void;
  touchmove: (e: TouchEvent) => void;
}

interface TouchHandlers {
  start?: (wrapperEvent: TouchEvent & TouchWrapper) => void;
  end?: (wrapperEvent: TouchEvent & TouchWrapper) => void;
  move?: (wrapperEvent: TouchEvent & TouchWrapper) => void;
  left?: (wrapper: TouchWrapper) => void;
  right?: (wrapper: TouchWrapper) => void;
  up?: (wrapper: TouchWrapper) => void;
  down?: (wrapper: TouchWrapper) => void;
}

export interface TouchWrapper extends TouchHandlers {
  touchstartX: number;
  touchstartY: number;
  touchmoveX: number;
  touchmoveY: number;
  touchendX: number;
  touchendY: number;
  offsetX: number;
  offsetY: number;
}

interface TouchVNodeDirective extends VNodeDirective {
  value?: TouchHandlers & {
    parent?: boolean;
    options?: AddEventListenerOptions;
  };
}

const DIR_RATIO = 0.5;
const MIN_DISTANCE = 16;

const handleGesture = (wrapper: TouchWrapper) => {
  const {
    touchstartX, touchendX, touchstartY, touchendY,
  } = wrapper;
  wrapper.offsetX = touchendX - touchstartX;
  wrapper.offsetY = touchendY - touchstartY;

  if (Math.abs(wrapper.offsetY) < DIR_RATIO * Math.abs(wrapper.offsetX)) {
    wrapper.left && (touchendX < touchstartX - MIN_DISTANCE) && wrapper.left(wrapper);
    wrapper.right && (touchendX > touchstartX + MIN_DISTANCE) && wrapper.right(wrapper);
  }

  if (Math.abs(wrapper.offsetX) < DIR_RATIO * Math.abs(wrapper.offsetY)) {
    wrapper.up && (touchendY < touchstartY - MIN_DISTANCE) && wrapper.up(wrapper);
    wrapper.down && (touchendY > touchstartY + MIN_DISTANCE) && wrapper.down(wrapper);
  }
};

function touchstart(event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0];
  wrapper.touchstartX = touch.clientX;
  wrapper.touchstartY = touch.clientY;

  wrapper.start
    && wrapper.start(Object.assign(event, wrapper));
}

function touchend(event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0];
  wrapper.touchendX = touch.clientX;
  wrapper.touchendY = touch.clientY;

  wrapper.end
    && wrapper.end(Object.assign(event, wrapper));

  handleGesture(wrapper);
}

function touchmove(event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0];
  wrapper.touchmoveX = touch.clientX;
  wrapper.touchmoveY = touch.clientY;

  wrapper.move && wrapper.move(Object.assign(event, wrapper));
}

function createHandlers(value: TouchHandlers): TouchStoredHandlers {
  const wrapper = {
    touchstartX : 0,
    touchstartY : 0,
    touchendX   : 0,
    touchendY   : 0,
    touchmoveX  : 0,
    touchmoveY  : 0,
    offsetX     : 0,
    offsetY     : 0,
    left        : value.left,
    right       : value.right,
    up          : value.up,
    down        : value.down,
    start       : value.start,
    move        : value.move,
    end         : value.end,
  };

  return {
    touchstart : (e: TouchEvent) => touchstart(e, wrapper),
    touchend   : (e: TouchEvent) => touchend(e, wrapper),
    touchmove  : (e: TouchEvent) => touchmove(e, wrapper),
  };
}

function inserted(el: HTMLElement, binding: TouchVNodeDirective) {
  const value = binding.value!;
  const target = value.parent ? el.parentElement : el;
  const options = value.options || { passive: true };

  // Needed to pass unit tests
  if (!target) return;

  const handlers = createHandlers(binding.value!);

  keys(handlers).forEach((eventName) => {
    on(target, eventName, handlers[eventName] as EventListener, options);
  });

  function destroy() {
    keys(handlers).forEach((eventName) => {
      off(target!, eventName, handlers[eventName] as EventListener);
    });
  }

  (target as any).vTouch = {
    destroy,
  };
}

function unbind(el: HTMLElement) {
  const { vTouch } = el as any;
  if (!vTouch) return;
  vTouch.destroy();
  delete (el as any).vTouch;
}

function update(el: HTMLElement, binding: TouchVNodeDirective) {
  if (binding.value === binding.oldValue) {
    return;
  }
  if (binding.oldValue) {
    unbind(el);
  }
  inserted(el, binding);
}

export const Touch = {
  inserted,
  unbind,
  update,
} as DirectiveOptions;

export default Touch;
