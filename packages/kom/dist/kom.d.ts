import { ComponentOptions } from 'vue/types/options';
import { ThisTypedComponentOptionsWithRecordProps } from 'vue/types/options';
import { default as Vue_2 } from 'vue';
import { VueConstructor } from 'vue';

export declare type ArrayState = string[];

export declare function compose<T>(middleware: MiddlewareFn[]): ComposedMiddlewareFn<T>;

export declare type ComposedMiddlewareFn<T = any> = (context: T, next?: () => any) => Promise<any>;

declare const _default: {
    install: (target?: VueConstructor<Vue_2>) => void;
};
export default _default;

export declare const install: (target?: VueConstructor<Vue_2>) => void;

export declare class Layer<T extends LayerContext = LayerContext> {
    ns: string;
    middleware: MiddlewareFn<T>[];
    context: object;
    constructor(ns?: string);
    use(pathOrFn: string | MiddlewareFn<T>, fn?: MiddlewareFn<T>, thisArg?: any): this;
    callback(): ComposedMiddlewareFn<T>;
    dispatch<R = any, P extends Payload = Payload>(path: string, payload?: P): Promise<R>;
    createContext(): T;
}

export declare interface LayerContext<P extends Payload = Payload> {
    [key: string]: any;
    ns: string;
    path: string;
    payload: P;
    push: (ns: string) => (() => void) | undefined;
    match: (name: string) => boolean;
}

export declare type LayerMiddlewareFn<T extends LayerContext = LayerContext> = MiddlewareFn<T>;

export declare const mapStore: (store: StoreMap | StoreMap[], exportNS?: boolean) => import("vue/types/options").Accessors<import("vue/types/options").DefaultComputed>;

export declare type MiddlewareFn<T = any> = (context: T, next: () => Promise<any>) => Promise<any>;

export declare class Model extends Layer<ModelContext> {
    parent?: Model;
    submodel: {
        [key: string]: Model;
    };
    mixins: ComponentOptions<Vue_2>[];
    data: {
        [key: string]: any;
    };
    computed: {
        [key: string]: () => any;
    };
    watch: {
        [key: string]: () => any;
    };
    events: {
        [key: string]: (() => any)[];
    };
    store?: Vue_2;
    options?: object;
    d: {
        [key: string]: any;
    };
    constructor(ns?: string);
    get(key: string | number): any;
    set(key: string | number, val: any): void;
    get root(): Model;
    initialized(): boolean;
    mount(key: string, model: Model): this;
    model(key?: string, val?: Model): Model;
    up(): Model;
    provide<Data, Computed, Methods, Props>(key: string | ModelDefines<Data, Computed, Methods, Props>, val?: any): this;
    hook(key: string, fn: () => any): this;
    subscribe(key: string, fn: () => void): this;
    broadcast(event: string, ...args: any[]): this;
    getModel(ns?: string): Model;
    getStore(ns?: string): Vue_2 | undefined;
    setNS(ns?: string): void;
    setParent(parent?: Model): void;
    genVM(parent?: Vue_2): Vue_2;
    init(options?: object): this;
    destroy(): void;
    createContext(): ModelContext;
}

export declare interface ModelContext extends LayerContext {
    model: Model;
    store: Vue_2;
    getModel: (ns: string) => Model | undefined;
    getStore: (ns: string) => Vue_2 | undefined;
    get: (key: any) => any;
    set: (key: any, val: any) => void;
}

export declare type ModelDefines<Data = any, Computed = any, Methods = any, Props = any> = ThisTypedComponentOptionsWithRecordProps<Vue_2 & ModelInjection, Data, Methods, Computed, Props> & {
    middleware?: {
        [key: string]: MiddlewareFn<ModelContext>;
    };
    subscribe?: {
        [key: string]: () => any;
    };
};

export declare type ModelInjection = {
    $kom: Model;
    $model: Model;
    $store: Vue_2;
    $getModel: Model['getModel'];
    $getStore: Model['getStore'];
    $dispatch: Model['dispatch'];
    $broadcast: Model['broadcast'];
    $subscribe: Model['subscribe'];
};

export declare type ModelMiddlewareFn<T extends ModelContext = ModelContext> = MiddlewareFn<T>;

export declare const nextTick: {
    <T>(callback: (this: T) => void, context?: T | undefined): void;
    (): Promise<void>;
};

export declare type ObjectState = {
    [key: string]: string | ((store: Vue_2) => any);
};

export declare interface Payload {
    [key: string]: any;
}

export declare type StoreMap = {
    ns?: string;
    state: ObjectState | ArrayState;
};

export { }
