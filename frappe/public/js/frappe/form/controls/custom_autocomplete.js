import CustomAwesomplete from "./vue_controls/CustomAwesomplete.vue";
import { createApp, h } from "vue";

// NOTE: This is just for ref. purpose. Many things still need to check in detail and not works as expected in some cases.
frappe.ui.form.ControlCustomAutocomplete  = class ControlCustomAutocomplete  extends (
	frappe.ui.form.ControlData
) {
	static trigger_change_on_input_event = false;

	make_input() {
		// Prepare input area container
		super.make_input();

		const container = document.createElement("div");
		this.input_area.innerHTML = ""; // clear existing
		this.input_area.appendChild(container);

		const options = this.parse_options(this.df.options || []);

		this._data = options;
		this.autocomplete_open = false;
		this.selected = false;

		const settings = this.get_awesomplete_settings();

		// Create Vue app
		this.vueApp = createApp({
			render: () =>
				h(CustomAwesomplete, {
					ref: "autocomplete",
					list: options,
					settings,
					onChange: this.on_input.bind(this),
					onInputFocus: this.on_focus.bind(this),
					onInputBlur: this.on_blur.bind(this),
					onAwesompleteOpen: () => (this.autocomplete_open = true),
					onAwesompleteClose: () => (this.autocomplete_open = false),
					onAwesompleteSelect: () => {
						this.$input.trigger("change");
					},
				}),
		});

		SetVueGlobals(this.vueApp);
		const vm = this.vueApp.mount(container);
		this.$input = $(vm.$refs.autocomplete.$refs.input);
		this.input = this.$input[0];
		this.has_input = true;
		this.bind_change_event();

		// preserve compatibility
		this.componentRef = vm.$refs.autocomplete;
	}

	on_input(value) {
		if (this.get_query || this.df.get_query) {
			this.execute_query_if_exists(value);
		} else {
			this.componentRef.setList(this._data);
		}
	}

	on_focus() {
		if (!this.$input.val()) {
			this.$input.trigger("input");
		}
	}

	on_blur() {
		if (this.selected) {
			this.selected = false;
			return;
		}

		const value = this.get_input_value();
		if (value !== this.last_value) {
			this.parse_validate_and_set_in_model(value);
		}
	}

	get_input_value() {
		const label = this.componentRef.getValue();
		const item = this._data.find((i) => i.label == label);
		return item ? item.value : label;
	}

	format_for_input(value) {
		if (value == null) return "";
		const item = this._data.find((i) => i.value == value);
		return item ? item.label : value;
	}

	set_data(data) {
		const parsed = this.parse_options(data);
		this._data = parsed;
		if (this.componentRef) {
			this.componentRef.setList(parsed);
		}
	}

	get_data() {
		return this._data || [];
	}

	get_awesomplete_settings() {
		return {
			tabSelect: true,
			minChars: 0,
			maxItems: this.df.max_items || 99,
			autoFirst: true,
			list: this.get_data(),
			sort: () => 0,
		};
	}

	parse_options(options) {
		if (typeof options === "string" && options[0] === "[") {
			options = frappe.utils.parse_json(options);
		}
		if (typeof options === "string") {
			options = options.split("\n");
		}
		if (typeof options[0] === "string") {
			options = options.map((o) => ({ label: o, value: o }));
		}

		return options.map((o) => {
			if (typeof o !== "string") {
				o.label = __(cstr(o.label));
				o.value = cstr(o.value);
			}
			return o;
		});
	}

	execute_query_if_exists(term) {
		const args = { txt: term };
		const get_query = this.get_query || this.df.get_query;

		const set_nulls = (obj) => {
			$.each(obj, (k, v) => {
				if (v !== undefined) obj[k] = v;
			});
			return obj;
		};

		const process_query_object = (obj) => {
			if (obj.query) args.query = obj.query;
			if (obj.params) Object.assign(args, set_nulls(obj.params));
			if (obj.translate_values !== undefined) this.translate_values = obj.translate_values;
		};

		if ($.isPlainObject(get_query)) {
			process_query_object(get_query);
		} else if (typeof get_query === "string") {
			args.query = get_query;
		} else {
			const q = get_query(this.frm?.doc || this.doc, this.doctype, this.docname);
			if (typeof q === "string") args.query = q;
			else if ($.isPlainObject(q)) process_query_object(q);
		}

		if (args.query) {
			frappe.call({
				method: args.query,
				args,
				callback: ({ message }) => {
					this.set_data(message);
				},
			});
		}
	}

	validate(value) {
		if (this.df.ignore_validation) return value || "";
		const valid_values = (this._data || []).map((d) => d.value);
		return valid_values.includes(value) ? value : "";
	}
};
