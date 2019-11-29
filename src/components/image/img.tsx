import { createNamespace } from '@/utils/namespace';
import '@/components/image/img.scss';

const [createComponent, bem] = createNamespace('img');

export default createComponent({
  props : {
    alt : String,
    src : String,
  },

  data() {
    return {
      loading   : false,
      loaderror : false,
      loadsrc   : '',
    };
  },

  watch : {
    src() {
      this.addIO();
    },
  },

  mounted() {
    this.addIO();
  },

  beforeDestroy() {
    this.removeIO();
  },

  methods : {
    addIO() {
      if (this.src === undefined) {
        return;
      }
      if ('IntersectionObserver' in window) {
        this.removeIO();
        this.io = new IntersectionObserver(data => {
          // because there will only ever be one instance
          // of the element we are observing
          // we can just use data[0]
          if (data[0].isIntersecting) {
            this.load();
            this.removeIO();
          }
        });

        this.io.observe(this.$el);
      } else {
        // fall back to setTimeout for Safari and IE
        setTimeout(() => this.load(), 200);
      }
    },

    removeIO() {
      if (this.io) {
        this.io.disconnect();
        this.io = undefined;
      }
    },

    load() {
      this.loadsrc = this.src;
      this.$emit('aboutToLoad');
      this.loading = true;
      this.loaderror = false;
    },

    onLoad() {
      this.$emit('loaded');
      this.loading = false;
      this.loaderror = false;
    },
    onError() {
      if (!this.loadsrc) return;
      this.$emit('error');
      this.loading = false;
      this.loaderror = true;
    },
  },

  render() {
    return (
      <div
        class={bem()}
      >
        <img
          decoding="async"
          src={this.loadsrc}
          alt={this.alt}
          onLoad={this.onLoad}
          onError={this.onError}
        />
      </div>
    );
  },
});
