/* eslint-disable import/extensions, max-len */
import { CombinedVueInstance, Vue } from 'vue/types/vue';
import {
  ComponentOptions,
  FunctionalComponentOptions,
  RecordPropsDefinition,
  ThisTypedComponentOptionsWithArrayProps,
  ThisTypedComponentOptionsWithRecordProps,
} from 'vue/types/options';
import { ScopedSlot, VNode } from 'vue/types/vnode';

import { Mods } from '@line-ui/line/src/utils/bem';
import { unifySlots } from '@line-ui/line/src/utils/vnode';
import { componentInstall as install } from '@line-ui/line/src/utils/install';

import { useRender } from '@line-ui/line/src/mixins/use-render';
import { useSlots } from '@line-ui/line/src/mixins/use-slots';
import { useMode } from '@line-ui/line/src/mixins/use-mode';

export type TsxComponentProps<Props, Slots> = Props & {
  // hack for jsx prop spread
  key: string | number;
  ref: string;
  refInFor: boolean;
  slot: string;
  props: object;
  domProps: object;
  class: object | Mods;
  style: string | object[] | object;
  scopedSlots: { [key: string]: ScopedSlot | undefined } & Slots;
  on: object;
  nativeOn: object;
};

export type TsxComponent<Props, Slots> = (
  props: Partial<TsxComponentProps<Props, Slots>>
) => VNode;

export type LineComponent<
  Slots = any,
  Data = any,
  Methods = any,
  Computed = any,
  Props = any
> = (
  | FunctionalComponentOptions<Props>
  | ComponentOptions<Vue, Data, Methods, Computed, Props>
) & {
  name: string;
  install: typeof install;

  new (): CombinedVueInstance<Vue, Data, Methods, Computed, Props>;
} & TsxComponent<Props, Slots>;

export function defineComponent<V extends Vue = Vue>(
  name: string
): {
  <Slots, Data, Computed, Methods, PropNames extends string = never>(
    sfc: ThisTypedComponentOptionsWithArrayProps<
      V,
      Data,
      Methods,
      Computed,
      PropNames
    >
  ): LineComponent<Slots, Data, Methods, Computed, Record<PropNames, any>>;

  <Slots, Data, Methods, Computed, Props>(
    sfc: ThisTypedComponentOptionsWithRecordProps<
      V,
      Data,
      Methods,
      Computed,
      Props
    >
  ): LineComponent<Slots, Data, Methods, Computed, Props>;

  <Slots, PropNames extends string = never>(
    sfc: FunctionalComponentOptions<Record<PropNames, any>, PropNames[]>
  ): LineComponent<Slots, {}, {}, {}, Record<PropNames, any>>;

  <Slots, Props>(
    sfc: FunctionalComponentOptions<Props, RecordPropsDefinition<Props>>
  ): LineComponent<Slots, {}, {}, {}, Props>;

  (sfc: ComponentOptions<V>): LineComponent<{}, {}, {}, {}>;

  createComponent: any;
  bem: any;
};

export function defineComponent(name: string) {
  return function (sfc: any) {
    sfc.name = name;
    sfc.install = install;

    if (sfc.functional) {
      const { render } = sfc;
      sfc.render = (h: any, ctx: any) =>
        render.call(undefined, h, unifySlots(ctx));
    } else {
      sfc.mixins = sfc.mixins || [];
      sfc.mixins.push(
        // enhance render function
        // provide shouldRender/beforeRender/afterRender lifecycle hooks
        useRender(),
        // unify slots function, scoped first,
        // inject special slot class for slots
        useSlots(),
        // inherit mode property from root component
        useMode()
      );
    }

    return sfc;
  };
}

export type CreateComponent = ReturnType<typeof defineComponent>;
