import { createNamespace } from 'skyline/utils/namespace';
import { useModel } from 'skyline/mixins/use-model';
import { stop } from 'skyline/utils/dom/event-modifier';
import { createColorClasses, useColor } from 'skyline/mixins/use-color';

const { createComponent, bem } = /*#__PURE__*/ createNamespace('textarea');

const findItemLabel = (componentEl: HTMLElement) => {
  const itemEl = componentEl && componentEl.closest('.line-item');
  if (itemEl) {
    return itemEl.querySelector('.line-label');
  }
  return null;
};

let textareaIds = 0;

export default /*#__PURE__*/ createComponent({
  mixins : [
    /*#__PURE__*/ useModel('nativeValue', { event: 'textareaChange' }),
    /*#__PURE__*/ useColor(),
  ],

  inject : {
    Item : { default: undefined },
  },

  props : {
    autocapitalize : {
      type    : String,
      default : 'none',
    },
    autofocus : {
      type    : Boolean,
      default : false,
    },
    clearOnEdit : {
      type    : Boolean,
      default : false,
    },
    disabled : {
      type    : Boolean,
      default : false,
    },
    maxlength : {
      type : Number,
    },
    minlength : {
      type : Number,
    },
    placeholder : {
      type : String,
    },
    readonly : {
      type    : Boolean,
      default : false,
    },
    required : {
      type    : Boolean,
      default : false,
    },
    spellcheck : {
      type    : Boolean,
      default : false,
    },
    cols : {
      type : Number,
    },
    rows : {
      type : Number,
    },
    wrap : {
      type : String,
    },
    autoGrow : {
      type    : Boolean,
      default : false,
    },
  },

  data() {
    return {
      hasFocus         : false,
      didBlurAfterEdit : false,
    };
  },

  beforeMount() {
    this.inputId = `ion-input-${ textareaIds++ }`;
  },

  mounted() {
    const { nativeInput } = this.$refs;
    this.nativeInput = nativeInput;

    this.runAutoGrow();
    this.emitStyle();
  },

  methods : {
    disabledChanged() {
      this.emitStyle();
    },

    // TODO: performance hit, this cause layout thrashing
    runAutoGrow() {
      const { nativeInput } = this;
      if (nativeInput && this.autoGrow) {
        this.$nextTick(() => {
          nativeInput.style.height = 'inherit';
          nativeInput.style.height = `${ nativeInput.scrollHeight }px`;
        });
      }
    },

    /**
     * Sets focus on the specified `ion-textarea`. Use this method instead of the global
     * `input.focus()`.
     */
    async setFocus() {
      if (this.nativeInput) {
        this.nativeInput.focus();
      }
    },

    /**
     * Returns the native `<textarea>` element used under the hood.
     */
    getInputElement(): Promise<HTMLTextAreaElement> {
      return Promise.resolve(this.nativeInput!);
    },

    emitStyle() {
      if (!this.Item) return;

      this.Item.itemStyle(
        'textarea',
        {
          interactive            : true,
          textarea               : true,
          input                  : true,
          'interactive-disabled' : this.disabled,
          'has-placeholder'      : this.placeholder != null,
          'has-value'            : this.hasValue(),
          'has-focus'            : this.hasFocus,
        },
      );
    },

    /**
     * Check if we need to clear the text input if clearOnEdit is enabled
     */
    checkClearOnEdit() {
      if (!this.clearOnEdit) {
        return;
      }

      // Did the input value change after it was blurred and edited?
      if (this.didBlurAfterEdit && this.hasValue()) {
        // Clear the input
        this.nativeValue = '';
      }

      // Reset the flag
      this.didBlurAfterEdit = false;
    },

    focusChange() {
      // If clearOnEdit is enabled and the input blurred but has a value, set a flag
      if (this.clearOnEdit && !this.hasFocus && this.hasValue()) {
        this.didBlurAfterEdit = true;
      }
      this.emitStyle();
    },

    hasValue(): boolean {
      return this.getValue() !== '';
    },

    getValue(): string {
      return this.value || '';
    },

    onInput() {
      if (this.nativeInput) {
        this.nativeValue = this.nativeInput.value;
      }
      this.emitStyle();
    },

    onFocus() {
      this.hasFocus = true;
      this.focusChange();

      this.$emit('focus');
    },

    onBlur() {
      this.hasFocus = false;
      this.focusChange();

      this.$emit('blur');
    },

    onChange() {
      //
    },

    onKeyDown() {
      this.checkClearOnEdit();
    },
  },

  watch : {
    value() {
      this.runAutoGrow();
      this.emitStyle();
    },

    disabled() {
      this.disabledChanged();
    },
  },

  render() {
    const {
      nativeValue, rows, maxlength, placeholder, readonly, disabled,
      autocapitalize, autofocus, color, cols, spellcheck, wrap, minlength,
    } = this;
    const labelId = `${ this.inputId }-lbl`;
    const label = findItemLabel(this.$el as HTMLElement);
    if (label) {
      label.id = labelId;
    }

    return (
      <div
        class={[bem(), { ...createColorClasses(color) }]}
        on={this.$listeners}
      >
        <textarea
          class="native-textarea"
          ref='nativeInput'
          autoCapitalize={autocapitalize}
          autoFocus={autofocus}
          cols={cols}
          rows={rows}
          wrap={wrap}
          maxlength={maxlength}
          minlength ={minlength}
          placeholder={placeholder || ''}
          spellCheck={spellcheck}
          readonly={readonly}
          disabled={disabled}
          onInput={this.onInput}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onChange={stop(this.onChange)}
        >
          {nativeValue}
        </textarea>
      </div>
    );
  },

});
