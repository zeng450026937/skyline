import Vue, { VueConstructor } from 'vue';

type GroupData = {
  checkState: number
  checkedItem: Array<any>
  items: Array<Vue>
};

export type Group<T extends string, C extends VueConstructor | null = null> =
  VueConstructor<Vue & {
    exclusive: boolean
    checkState: number
    checkedItem: Array<any>
    items: Array<Vue>
    registerItem (...args: any[]): void
    unregisterItem (...args: any[]): void
  }>;

export const CheckState = {
  Unchecked: 1,
  PartiallyChecked: 2,
  Checked: 3,
};

export function createGroup<T extends string, C extends VueConstructor | null = null>(
  name: string, prop:string = 'modelValue', event:string = 'change',
): Group<T, C> {
  return Vue.extend({
    provide(): Object {
      return {
        [name]: this,
      };
    },

    model: { prop, event },

    props: {
      [prop]: {
        type: Array,
        default: (): Array<any> => ([]),
      },

      exclusive: {
        type: Boolean,
        default: false,
      },
    },

    data(): GroupData {
      return {
        checkState: CheckState.Unchecked,
        checkedItem: this[prop] as Array<Vue>,
        items: [],
      };
    },

    mounted() {
      const { length: count } = this[prop] as Array<Vue>;
      this.checkState = count === 0
        ? CheckState.Unchecked
        : count === this.items.length
          ? CheckState.Checked
          : CheckState.PartiallyChecked;

      this.items.forEach((item) => {
        (item as any).checked = this.checkedItem.includes(item);
      });
    },

    watch: {
      [prop](val) {
        this.checkedItem = val;
      },
      checkedItem(val) {
        event && this.$emit(event, val);
      },
      exclusive(val) {
        if (!val) return;
        if (this.checkedItem.length > 1) {
          const [first] = this.checkedItem;
          this.checkedItem = [first];
        }
      },
    },

    methods: {
      onItemChecked(item: Vue, checked: boolean) {
        const { value } = item as any;
        if (this.exclusive) {
          if (checked) {
            this.checkedItem = [value];
            this.items.forEach((i: Vue) => {
              if (i === item) return;
              (i as any).checked = false;
            });
          } else if (this.checkedItem[0] === value) {
            this.checkedItem = [];
          }
        } else {
          this.checkedItem = this.checkedItem || [];
          const index = this.checkedItem.indexOf(value);
          if (checked && index === -1) {
            this.checkedItem.push(value);
          } else if (!checked && index !== -1) {
            this.checkedItem.splice(index, 1);
          }
        }
      },
      registerItem(item: Vue): number {
        const index = this.items.push(item);
        item.$watch('checked', val => this.onItemChecked(item, val));
        return index;
      },
      unregisterItem(item: Vue) {
        const index = this.items.indexOf(item);
        this.items.splice(index, 1);
      },
    },
  });
}
