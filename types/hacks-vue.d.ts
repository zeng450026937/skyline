/* eslint-disable import/extensions */
import {
  VNode,
  VueConstructor,
  ComponentOptions,
  FunctionalComponentOptions,
} from 'vue';
import { Vue } from 'vue/types/vue';

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    // use-patch
    shouldRender?: () => boolean;
    beforeRender?: () => void;
    afterRender?: (vnode: VNode, ctx: RenderContext) => void;
    // namespace
    events?: Record<string, any>;
    slots?: Record<string, any>;
    install?: (Vue: VueConstructor) => void;
  }

  interface RenderContext {
    slots(name?: string, props?: any): any;
  }

  interface FunctionalComponentOptions {
    // namespace
    slots?: object;
    install?: (Vue: VueConstructor) => void;
  }
}

declare module 'vue/types/vue' {
  interface VueConstructor<V extends Vue = Vue> {
    name?: string;
    install?: (Vue: VueConstructor) => void;
    version: string;
  }
}
