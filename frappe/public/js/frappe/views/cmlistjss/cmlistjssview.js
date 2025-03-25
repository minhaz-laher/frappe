frappe.provide("frappe.views");

frappe.views.CmlistjssView = class CmlistjssView extends frappe.views.ListView {
	get view_name() {
		return "Cmlistjss";
	}

	constructor(opts) {
		super(opts);

		// Load assets
		this.loadAssets();
	}

	// Load Jspreasdheet Asets.
	async loadAssets() {
		try {
			// Load JS files
			const jsFiles = await this.loadFilesFromDirectory("/assets/frappe/js/jss/", "js");
			await Promise.all(jsFiles.map((file) => this.loadJs(file)));

			// Load CSS files
			const cssFiles = await this.loadFilesFromDirectory("/assets/frappe/css/jss/", "css");
			await Promise.all(cssFiles.map((file) => this.loadCss(file)));

			console.log("All JSpreadsheet assets loaded successfully!");
			// this.initializeJSpreadsheet();
		} catch (error) {
			console.error("Error loading JSpreadsheet assets:", error);
		}
	}

	// Function to load a CSS file dynamically
	loadCss(href) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`link[href="${href}"]`)) {
				resolve(); // Already loaded
				return;
			}
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			link.onload = resolve;
			link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
			document.head.appendChild(link);
		});
	}

	// Function to load a JS file dynamically
	loadJs(src) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${src}"]`)) {
				resolve(); // Already loaded
				return;
			}
			const script = document.createElement("script");
			script.src = src;
			script.onload = resolve;
			script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
			document.body.appendChild(script);
		});
	}

	// Function to get file names from a directory
	async loadFilesFromDirectory(path, fileType) {
		try {
			const files = {
				js: ["jspreadsheet.js", "jsuites.js", "render.js", "parser.js", "formula-pro.js"],
				css: ["jspreadsheet.css", "jsuites.css", "jspreadsheet.themes.css"],
			};

			return files[fileType]?.map((file) => `${path}${file}`) || [];
		} catch (error) {
			console.error(`Failed to fetch file list from ${path}:`, error);
			return [];
		}
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
			const data = this.data; // IN:: Use this data in JSS.
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
	}
	render_count() {
		// Note:: This method is intentionally overridden as the parent implementation is not needed.
	}
	update_checkbox() {
		// Note:: This method is intentionally overridden as the parent implementation is not needed.
	}
};
