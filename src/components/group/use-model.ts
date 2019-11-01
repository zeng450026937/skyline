import Vue from 'vue';

export interface ModelOptions {
  prop?: string,
  event?: string,
}

export const DEFAULT_PROP = 'modelValue';
export const DEFAULT_EVENT = 'change';

export function useModel(proxy: string, options?: ModelOptions) {
  const {
    prop = DEFAULT_PROP,
    event = DEFAULT_EVENT,
  } = options || {};

  return Vue.extend({
    model: { prop, event },

    props: {
      [prop]: null as any,
    },

    data() {
      return {
        [proxy]: this[prop],
      };
    },

    watch: {
      [prop](val: any) {
        this[proxy] = val;
      },
      [proxy](val: any) {
        val !== this[prop] && (this as any).$emit(event, val);
      },
    },
  });
}
