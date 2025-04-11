<template>
  <div ref="wrapper">
    <input ref="input" type="text" class="input-with-feedback form-control" autocomplete="off" @input="onInput"
      @focus="onFocus" @blur="onBlur" />
  </div>
</template>

<script>
// NOTE: This is just for ref. purpose. Many things still need to check in detail and not works as expected in some cases.
import Awesomplete from "awesomplete";

// Patch Awesomplete
if (typeof Awesomplete !== "undefined") {
  Awesomplete.prototype.get_item = function (value) {
    return this._list?.find((item) => item?.value === value);
  };
}

export default {
  name: "CustomAwesomplete",
  props: {
    list: Array,
    settings: Object,
  },
  emits: ["awesomplete-select", "awesomplete-open", "awesomplete-close", "change", "input-blur", "input-focus"],
  data() {
    return {
      awesomplete: null,
    };
  },
  mounted() {
    this.setupAwesomplete();
  },
  methods: {
    setupAwesomplete() {
      this.awesomplete = new Awesomplete(this.$refs.input, {
        ...this.settings,
        list: this.list,
        item: this.renderItem,
        filter: this.filter,
        data: this.data,
      });


      this.$refs.input.addEventListener("awesomplete-selectcomplete", (e) => {
        this.$emit("awesomplete-select", e);
        this.$emit("change", this.$refs.input.value);
      });

      this.$refs.input.addEventListener("awesomplete-open", () => {
        this.$emit("awesomplete-open");
      });

      this.$refs.input.addEventListener("awesomplete-close", () => {
        this.$emit("awesomplete-close");
      });
    },
    onInput(e) {
      this.$emit("change", e.target.value);
    },
    onFocus(e) {
      this.$emit("input-focus", e);
    },
    onBlur(e) {
      this.$emit("input-blur", e);
    },
    setList(list) {
      if (this.awesomplete) {
        this.awesomplete.list = list;
      }
    },
    getValue() {
      return this.$refs.input.value;
    },
    // Define the custom item renderer here
    renderItem(item) {
      const d = this.awesomplete.get_item(item.value) || item;
      d.label = d.label || d.value;

      let html = "<strong>" + d.label + "</strong>";
      if (d.description) {
        html += `<br><span class="small">${d.description}</span>`;
      }

      return $("<li></li>")
        .data("item.autocomplete", d)
        .prop("aria-selected", "false")
        .html("<a><p>" + html + "</p></a>")
        .get(0);
    },

    filter(item, input) {
      const hay = item.label + item.value;
      return Awesomplete.FILTER_CONTAINS(hay, input);
    },

    data(item) {
      if (typeof item !== "object") item = { value: item };
      return {
        label: item.label || item.value,
        value: item.value,
      };
    }

  },
};
</script>
