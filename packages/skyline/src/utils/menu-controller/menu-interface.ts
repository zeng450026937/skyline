import { Animation, Side } from 'skyline/types/interface.d';

export interface MenuI {
  el: Element;
  mode: string;
  side: Side;
  menuId?: string;
  disabled: boolean;
  isAnimating: boolean;
  width: number;
  isEndSide: boolean;
  _isOpen: boolean;

  backdropEl?: HTMLElement;
  menuInnerEl?: HTMLElement;
  contentEl?: HTMLElement;
  menuCtrl?: MenuControllerI;

  isActive(): Promise<boolean>;
  open(animated?: boolean): Promise<boolean>;
  close(animated?: boolean): Promise<boolean>;
  toggle(animated?: boolean): Promise<boolean>;
  setOpen(shouldOpen: boolean, animated?: boolean): Promise<boolean>;
  _setOpen(shouldOpen: boolean, animated?: boolean): Promise<boolean>;
}

export interface MenuControllerI {
  _createAnimation(type: string, menuCmp: MenuI): Promise<Animation>;
  _setOpen(menu: MenuI, shouldOpen: boolean, animated: boolean): Promise<boolean>;
  _register(menu: MenuI): void;
  _unregister(menu: MenuI): void;
  _setActiveMenu(menu: MenuI): void;

  getMenus(): Promise<Element[]>;
  getOpenSync(): Element | undefined;
}

export interface MenuChangeEventDetail {
  disabled: boolean;
  open: boolean;
}