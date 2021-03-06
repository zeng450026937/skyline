import Vue, { VueConstructor, ComponentOptions } from 'vue';
import { Model, keys } from './model';

export { compose, MiddlewareFn, ComposedMiddlewareFn } from './compose';
export { LayerContext, Payload, LayerMiddlewareFn, Layer } from './layer';
export {
  ModelContext,
  ModelMiddlewareFn,
  ModelInjection,
  ModelDefines,
  Model,
  nextTick,
} from './model';

declare module 'vue/types/options' {
  type StoreMap =
    | {
        ns: string;
        state: { [key: string]: string | ((store: Vue) => any) } | string[];
      }
    | string;

  interface ComponentOptions<V extends Vue> {
    kom?: Model;
    subscribe?: { [key: string]: () => any };
    store?: StoreMap | StoreMap[];
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $kom: Model;
    $model: Model;
    $store: Vue;
    $getModel: Model['getModel'];
    $getStore: Model['getStore'];
    $dispatch: Model['dispatch'];
    $broadcast: Model['broadcast'];
    $subscribe: Model['subscribe'];
  }
}

export type ObjectState = { [key: string]: string | ((store: Vue) => any) };
export type ArrayState = string[];

export type StoreMap =
  | {
      ns: string;
      state?: ObjectState | ArrayState;
      exportNS?: boolean;
    }
  | string;

const normalizeState = (state: ObjectState | ArrayState): ObjectState => {
  if (Array.isArray(state)) {
    state = state.reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {} as ObjectState);
  }
  return state;
};

export const mapStore = (store: StoreMap | StoreMap[]) => {
  const computed: ComponentOptions<Vue>['computed'] = {};
  if (!Array.isArray(store)) {
    store = [store];
  }
  store.forEach((s) => {
    if (typeof s === 'string') {
      s = { ns: s };
    }
    const { ns, state: rawState, exportNS = ns && !rawState } = s;
    if (exportNS) {
      computed[ns] = function nsGetter(this: Vue) {
        return this.$getStore(ns)!;
      };
    }
    if (rawState) {
      const state = normalizeState(rawState);
      keys(state).forEach((key) => {
        if (__DEV__ && computed[key]) {
          console.warn(`state was definded: ${key}`);
        }
        const val = state[key];
        let store: Vue | undefined;
        computed[key] = {
          get(this: Vue) {
            store = store || this.$getStore(ns)!;
            return typeof val === 'function'
              ? val.call(this, store)
              : store[val];
          },
          set(this: Vue, val: any) {
            store = store || this.$getStore(ns)!;
            store[key] = val;
          },
        };
      });
    }
  });
  return computed;
};

export const install = (target: VueConstructor = Vue) => {
  if ((target as any).__kom__) return;

  target.mixin({
    beforeCreate() {
      const options = this.$options;
      const kom = options.kom || (options.parent && options.parent.$kom);

      if (!kom) return;

      if (__DEV__ && !(kom instanceof Model)) {
        console.warn('invalid kom.');
        return;
      }
      const router =
        options.router || (options.parent && options.parent.$router);

      kom.init({ router });

      this.$kom = kom;
      this.$model = kom;
      this.$store = kom.store!;
      this.$getModel = kom.getModel.bind(kom);
      this.$getStore = kom.getStore.bind(kom);
      this.$dispatch = kom.dispatch.bind(kom);
      this.$broadcast = kom.broadcast.bind(kom);
      this.$subscribe = kom.subscribe.bind(kom);

      const unsubscribe = (event: string, fn: Function) =>
        kom.store!.$root.$off(event, fn);

      const { subscribe, store } = options;

      if (subscribe) {
        const dispose: Function[] = [];

        keys(subscribe).forEach((key) => {
          const fn = subscribe[key].bind(this);
          dispose.push(() => unsubscribe(key as string, fn));
          this.$subscribe(key as string, fn);
        });

        this.__komDispose__ = dispose;
      }

      if (store) {
        options.computed = {
          ...options.computed,
          ...mapStore(store),
        };
      }
    },

    beforeDestroy(this: Vue) {
      const dispose = this.__komDispose__;
      dispose && dispose.forEach((f: Function) => f());
    },
  });

  (target as any).__kom__ = true;
};

function defaulExport() {
  // auto install for umd build
  if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
  }

  return { install };
}

export default /*#__PURE__*/ defaulExport();
