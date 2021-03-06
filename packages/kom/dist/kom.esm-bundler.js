import Vue from 'vue';

function compose(middleware) {
    return function composedMiddleware(context, next) {
        const dispatch = async (i) => {
            if ((process.env.NODE_ENV !== 'production') && i <= index) {
                console.warn('next() called multiple times');
                return;
            }
            index = i;
            let fn = middleware[i];
            if (i === middleware.length)
                fn = next;
            if (!fn)
                return;
            return fn(context, dispatch.bind(null, i + 1));
        };
        // last called middleware
        let index = -1;
        return dispatch(0);
    };
}

const SEPARATOR = '/';
class Layer {
    constructor(ns = '') {
        this.ns = ns;
        this.middleware = [];
        this.context = {};
    }
    use(pathOrFn, fn, thisArg) {
        const handler = fn
            ? createHandler(pathOrFn, fn, thisArg)
            : pathOrFn;
        this.middleware.push(handler);
        return this;
    }
    callback() {
        return (ctx, next) => {
            const pop = ctx.push(this.ns);
            if (pop) {
                const wrappedNext = next
                    ? async () => {
                        pop();
                        return next();
                    }
                    : next;
                return compose(this.middleware)(ctx, wrappedNext);
            }
            return next ? next() : Promise.resolve();
        };
    }
    dispatch(path, payload) {
        const ctx = this.createContext();
        ctx.path = path;
        ctx.payload = payload || {};
        const stack = `${this.ns}/${path}`.split(SEPARATOR).filter(Boolean);
        let deep = 0;
        ctx.push = (ns) => {
            if (!ns || !stack.length) {
                return () => { };
            }
            if (deep < stack.length && ns === stack[deep]) {
                deep++;
                return () => {
                    deep--;
                };
            }
        };
        ctx.match = (name) => {
            return stack[deep] === name && deep === stack.length - 1;
        };
        return this.callback()(ctx);
    }
    createContext() {
        const context = Object.create(this.context);
        context.ns = this.ns;
        return context;
    }
}
const createHandler = (name, fn, thisArg) => {
    return (ctx, next) => {
        if (ctx.match(name)) {
            return fn.call(thisArg, ctx, next);
        }
        return next();
    };
};

/* eslint-disable import/extensions */
/* eslint-disable-next-line prefer-destructuring */
const nextTick = Vue.nextTick;
let hasStrategies;
function setupStrategies() {
    const strategies = Vue.config.optionMergeStrategies;
    strategies.middleware = strategies.methods;
    strategies.subscribe = strategies.methods;
}
class Model extends Layer {
    constructor(ns) {
        super(ns);
        this.submodel = {};
        this.mixins = [];
        this.data = {};
        this.computed = {};
        this.watch = {};
        this.events = {};
        this.d = {};
        if (!hasStrategies) {
            setupStrategies();
            hasStrategies = true;
        }
    }
    get(key) {
        return this.d[key];
    }
    set(key, val) {
        this.d[key] = val;
    }
    get root() {
        return this.parent ? this.parent.root : this;
    }
    initialized() {
        return !!this.store;
    }
    mount(key, model) {
        if ((process.env.NODE_ENV !== 'production') && this.submodel[key]) {
            console.warn(`redefinition model: ${key}`);
        }
        model.setNS(key);
        this.submodel[key] = model;
        return this;
    }
    model(key, val) {
        if (!key)
            return this;
        let model = this.submodel[key];
        if ((process.env.NODE_ENV !== 'production') && model && val) {
            console.warn(`model: ${key} was previously definded`);
            return model;
        }
        if (!model) {
            model = val || new Model();
            model.setNS(key);
            model.setParent(this);
            this.submodel[key] = model;
        }
        return model;
    }
    up() {
        return this.parent || this;
    }
    provide(key, val) {
        if (key && !val) {
            this.mixins.push(key);
            key = '';
        }
        if (!key)
            return this;
        if ((process.env.NODE_ENV !== 'production') && this.computed[key]) {
            console.warn(`redefinition key: ${key}`);
        }
        if (typeof val === 'function') {
            this.computed[key] = val;
        }
        else {
            this.data[key] = val;
        }
        return this;
    }
    hook(key, fn) {
        if (this.initialized()) {
            this.store.$watch(key, fn);
            return this;
        }
        this.watch[key] = fn;
        return this;
    }
    subscribe(key, fn) {
        if (this.initialized()) {
            this.store.$root.$on(key, fn);
            return this;
        }
        this.events[key] = this.events[key] || [];
        this.events[key].push(fn);
        return this;
    }
    broadcast(event, ...args) {
        if (this.initialized()) {
            this.store.$root.$emit(event, ...args);
            return this;
        }
        if ((process.env.NODE_ENV !== 'production')) {
            console.warn('broadcast() can only be used when initialized');
        }
        return this;
    }
    getModel(ns) {
        return ns ? chainget(ns, this, (m) => m.submodel) : this;
    }
    getStore(ns) {
        if ((process.env.NODE_ENV !== 'production') && !this.initialized()) {
            console.warn('getStore() can only be used when initialized');
            return;
        }
        const { store } = this;
        return ns ? chainget(ns, store) : store;
    }
    setNS(ns = '') {
        this.ns = ns;
    }
    setParent(parent) {
        this.parent = parent;
    }
    genVM(parent) {
        const model = this;
        return new Vue({
            ...this.options,
            parent,
            mixins: this.mixins,
            data: this.data,
            computed: this.computed,
            watch: this.watch,
            beforeCreate() {
                this.$kom = model.root;
                this.$model = model;
                this.$store = model.store;
                this.$getModel = model.getModel.bind(model.root);
                this.$getStore = model.getStore.bind(model.root);
                this.$dispatch = model.dispatch.bind(model.root);
                this.$broadcast = model.broadcast.bind(model);
                this.$subscribe = model.subscribe.bind(model);
            },
        });
    }
    init(options) {
        if (this.initialized())
            return this;
        this.options = options;
        const submodels = Object.keys(this.submodel);
        submodels.forEach((key) => {
            // submodel placeholder
            this.data[key] = {};
        });
        this.store = this.genVM(this.parent && this.parent.store);
        const { middleware, subscribe } = this.store.$options;
        if (middleware) {
            keys(middleware).forEach((name) => this.use(name, middleware[name], this.store));
        }
        if (subscribe) {
            keys(subscribe).forEach((name) => this.subscribe(name, subscribe[name]));
        }
        keys(this.events).forEach((name) => {
            this.events[name].forEach((fn) => this.subscribe(name, fn));
        });
        // fill submodel placeholder
        submodels.forEach((key) => {
            const m = this.submodel[key];
            m.init();
            this.use(m.callback());
            this.data[key] = m.store;
        });
        return this;
    }
    destroy() {
        if (!this.initialized())
            return;
        Object.keys(this.submodel).forEach((key) => this.submodel[key].destroy());
        this.store.$destroy();
    }
    createContext() {
        const context = super.createContext();
        context.model = this;
        context.store = this.store;
        context.getModel = this.getModel.bind(this);
        context.getStore = this.getStore.bind(this);
        context.get = this.get.bind(this);
        context.set = this.set.bind(this);
        return context;
    }
}
const keys = (o) => {
    return Object.keys(o);
};
const chainget = (ns, delegate, getter) => {
    return ns.split(SEPARATOR).reduce((acc, key) => {
        if (getter) {
            acc = getter(acc, key);
        }
        if (acc) {
            return acc[key];
        }
        return false;
    }, delegate);
};

const normalizeState = (state) => {
    if (Array.isArray(state)) {
        state = state.reduce((acc, key) => {
            acc[key] = key;
            return acc;
        }, {});
    }
    return state;
};
const mapStore = (store, exportNS = false) => {
    const computed = {};
    if (!Array.isArray(store)) {
        store = [store];
    }
    store.forEach((s) => {
        const { ns, state: rawState } = s;
        if (exportNS && ns) {
            computed[ns] = function nsGetter() {
                return this.$getStore(ns);
            };
        }
        const state = normalizeState(rawState);
        keys(state).forEach((key) => {
            if ((process.env.NODE_ENV !== 'production') && computed[key]) {
                console.warn(`state was definded: ${key}`);
            }
            const val = state[key];
            computed[key] = {
                get() {
                    const store = this.$getStore(ns);
                    return typeof val === 'function' ? val.call(this, store) : store[val];
                },
                set(val) {
                    const store = this.$getStore(ns);
                    store[key] = val;
                },
            };
        });
    });
    return computed;
};
const install = (target = Vue) => {
    if (target.__kom__)
        return;
    target.mixin({
        beforeCreate() {
            const options = this.$options;
            const kom = options.kom || (options.parent && options.parent.$kom);
            if (!kom)
                return;
            if ((process.env.NODE_ENV !== 'production') && !(kom instanceof Model)) {
                console.warn('invalid kom.');
                return;
            }
            const router = options.router || (options.parent && options.parent.$router);
            kom.init({ router });
            this.$kom = kom;
            this.$model = kom;
            this.$store = kom.store;
            this.$getModel = kom.getModel.bind(kom);
            this.$getStore = kom.getStore.bind(kom);
            this.$dispatch = kom.dispatch.bind(kom);
            this.$broadcast = kom.broadcast.bind(kom);
            this.$subscribe = kom.subscribe.bind(kom);
            const unsubscribe = (event, fn) => kom.store.$root.$off(event, fn);
            const { subscribe, store } = options;
            if (subscribe) {
                const dispose = [];
                keys(subscribe).forEach((key) => {
                    const fn = subscribe[key].bind(this);
                    dispose.push(() => unsubscribe(key, fn));
                    this.$subscribe(key, fn);
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
        beforeDestroy() {
            const dispose = this.__komDispose__;
            dispose && dispose.forEach((f) => f());
        },
    });
    target.__kom__ = true;
};
function defaulExport() {
    // auto install for umd build
    if (typeof window !== 'undefined' && window.Vue) {
        install(window.Vue);
    }
    return { install };
}
var index = /*#__PURE__*/ defaulExport();

export default index;
export { Layer, Model, compose, install, mapStore, nextTick };
