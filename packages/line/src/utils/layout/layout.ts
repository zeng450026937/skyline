import { LayoutItem } from './layout-item';

export type ItemCreator = (index: number) => LayoutItem;

export const DefaultItemCreator: ItemCreator = (index: number) =>
  new LayoutItem();

export class Layout extends LayoutItem {
  items: Array<LayoutItem>;

  constructor() {
    super();
    this.items = [];
  }

  get count() {
    return this.items.length;
  }

  setCount(count: number, item_creator: ItemCreator = DefaultItemCreator) {
    for (let index = Math.max(0, this.count - 1); index < count; index++) {
      const item = item_creator(index);
      this.addItem(item);
    }
    this.items.length = count;
  }

  addItem(item: LayoutItem): number {
    const last = this.count > 0 ? this.items[this.count - 1] : null;
    item.layout = this;
    item.previous = last;
    if (last) {
      last.next = item;
    }
    this.items.push(item);
    return this.count - 1;
  }

  removeItem(item: LayoutItem): number {
    const index = this.items.indexOf(item);
    this.takeAt(index);
    return index;
  }

  indexOf(item: LayoutItem) {
    return this.items.indexOf(item);
  }

  itemAt(index: number) {
    if (index < this.count) {
      return this.items[index];
    }
    return null;
  }

  takeAt(index: number) {
    if (index < this.count) {
      const item = this.items[index];
      const { previous, next } = item;
      item.layout = null;
      item.previous = null;
      item.next = null;
      if (previous) {
        previous.next = next;
      }
      if (next) {
        next.previous = previous;
      }
      this.items.splice(index, 1);
      return item;
    }
    return null;
  }
}
