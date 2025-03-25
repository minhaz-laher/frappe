frappe.provide("frappe.views");

frappe.views.CmlistjssView = class CmlistjssView extends frappe.views.ListView {
	get view_name() {
		return "Cmlistjss";
	}

	setup_defaults() {
		super.setup_defaults().then();
		this.view = "Cmlistjss"; // We can change viewname here.
		return super.setup_defaults().then((r) => {
			return r; // IN:: We can improve this syntax. The currently added syntax is just for testing purposes."
			// this.render_header(refresh_header);
			// this.render_count();
			// this.update_checkbox();
			// this.update_url_with_filters();
			// this.setup_realtime_updates();
			// this.apply_styles_basedon_dropdown();
		});
	}

	setup_view() {
		// IN:: Add logic here for setup columns
		super.setup_view();
		// this.setup_columns();
		// this.render_header();
		// this.render_skeleton();
		// this.setup_events();
		// this.settings.onload && this.settings.onload(this);
		// this.show_restricted_list_indicator_if_applicable();
	}

	refresh() {
		return super.refresh().then(() => {
			const data = this.data; 	// IN:: Use this data in JSS.
			// this.render_header(refresh_header);
			// this.render_count();
			// this.update_checkbox();
			// this.update_url_with_filters();
			// this.setup_realtime_updates();
			// this.apply_styles_basedon_dropdown();
		});

	}

	render() {
		super.render(); // IN:: Whis method call will not required as we will do custom render of JSS.
		// Add logic here for render JSS.
	}

	render_header(refresh_header = false) {
		// Note:: This method is intentionally overridden as the parent implementation is not needed.
	};
	render_count() {
		// Note:: This method is intentionally overridden as the parent implementation is not needed.
	};
	update_checkbox() {
		// Note:: This method is intentionally overridden as the parent implementation is not needed.
	};
};
