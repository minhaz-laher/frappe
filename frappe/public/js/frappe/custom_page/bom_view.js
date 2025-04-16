frappe.provide("frappe.views");

frappe.views.BomView = class BomView {
	constructor(opts) {
		Object.assign(this, opts);
		// Load required assets for JSpreadsheet.
		this.loadAssets();

		this.show();

		// Bind the `this` context to onResize and add the event listener.
		this.onResize = this.onResize.bind(this);
		window.addEventListener("resize", this.onResize);
		$("body").css("overflow", "hidden"); // Used because we are facing CSS issues for current page.
	}

	/**
	 * Getter for the view name
	 */
	get view_name() {
		return "BOM";
	}

	//#region Load JSpreadsheet assets and their license.
	// Improvement: We can move this common code to proper place or we can import jspreadsheet through npm.
	/**
	 * Asynchronously loads the required JSpreadsheet assets (JS files).
	 */
	async loadAssets() {
		try {
			// Load JavaScript files required for JSpreadsheet.
			const jsFiles = await this.loadFilesFromDirectory("/assets/frappe/js/jss/", "js");
			await Promise.all(jsFiles.map((file) => this.loadJs(file)));

			// Ensure JSpreadsheet is loaded before proceeding.
			if (typeof jspreadsheet === "undefined") {
				console.error("JSpreadsheet is not loaded yet!");
				return;
			}

			// Load the JSpreadsheet license key.
			this.load_jss_license();
		} catch (error) {
			console.error("Error loading JSpreadsheet assets:", error);
		}
	}

	/**
	 * Dynamically loads a JavaScript file and appends it to the document body.
	 *
	 * @param {string} src - The URL of the JS file.
	 * @returns {Promise} Resolves when the JS file is loaded.
	 */
	loadJs(src) {
		return new Promise((resolve, reject) => {
			// Check if the JS file is already loaded.
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

	/**
	 * Retrieves the list of required files (JS or CSS) from a given directory.
	 * This method helps in dynamically managing assets.
	 *
	 * @param {string} path - The directory path where the files are located.
	 * @param {string} fileType - The type of files to load ('js' or 'css').
	 * @returns {Promise<string[]>} A promise that resolves with the list of file URLs.
	 */
	async loadFilesFromDirectory(path, fileType) {
		try {
			// Predefined list of required JS and CSS files for JSpreadsheet.
			const files = {
				js: ["jspreadsheet.js", "jsuites.js", "render.js", "parser.js", "formula-pro.js"],
			};

			// Return the list of files with the full path.
			return files[fileType]?.map((file) => `${path}${file}`) || [];
		} catch (error) {
			console.error(`Failed to fetch file list from ${path}:`, error);
			return [];
		}
	}

	/**
	 * Loads the JSpreadsheet license key.
	 * This key is required to enable the full functionality of JSpreadsheet.
	 * Currently, a temporary license is used, but in the future, this will be fetched via an API call.
	 */
	async load_jss_license() {
		try {
			// Fetch license data from the 'jss_license' doctype
			const response = await frappe.db.get_single_value("jss_license", "jss_license");
			// Note: We will encrypt license in future task.

			// Check if a valid license key exists
			if (response) {
				jspreadsheet.setLicense(response);
				this.jss_license_loaded = true;
			} else {
				console.error("No JSpreadsheet license found in 'jss_license' doctype.");
				this.jss_license_loaded = true; // Added just to display the spreadsheet without a license.
			}
		} catch (error) {
			console.error("Failed to load JSpreadsheet license:", error);
		}
	}
	//#endregion Load JSpreadsheet assets and their license.

	//#region Setup Page Related Functions
	/**
	 * Displays the view by running a series of initialization tasks in order.
	 */
	show() {
		return frappe.run_serially([
			() => this.fetch_meta(), // Fetches the doctype metadata
			() => this.check_permissions(), // Ensures user has permission to view the doctype
			() => this.init(), // Initializes the view
			// () => this.before_refresh(),
			() => this.refresh(), // Refreshes the Data
		]);
	}

	/**
	 * Fetches metadata for the given doctype.
	 */
	fetch_meta() {
		// Note: Need to find out exact purpose of it.
		return frappe.model.with_doctype(this.doctype);
	}

	/**
	 * Checks if the current user has permission to view the doctype.
	 * If not, redirects to the homepage and throws a "Not Permitted" error.
	 */
	check_permissions() {
		if (!this.has_permissions()) {
			frappe.set_route("");
			frappe.throw(__("Not permitted to view {0}", [this.doctype]));
		}
	}

	/**
	 * Checks and returns whether the current user has read access to the doctype.
	 * Currently returns `true` as a placeholder.
	 * Replace with actual permission logic if needed.
	 */
	has_permissions() {
		// TODO: p3: Implement actual permission check
		return true;
		// return frappe.perm.has_perm(this.doctype, 0, "read");
	}

	/**
	 * Initializes the page/view by running a set of setup tasks in sequence.
	 * Ensures initialization only runs once by storing the promise.
	 * Tasks include setting defaults, building the page layout, and rendering the view.
	 * @returns {Promise} A promise that resolves when all initialization tasks are complete.
	 */
	init() {
		if (this.init_promise) return this.init_promise;

		let tasks = [
			this.setup_defaults, // Set initial variables and config
			this.setup_page, // Create the page layout and title bar
			// this.setup_side_bar,   // Optional: Sidebar logic (currently commented out)
			this.setup_main_section, // Initialize the main content section
			this.setup_view, // Finalize and render the view
		].map((fn) => fn.bind(this)); // Bind all methods to current context

		this.init_promise = frappe.run_serially(tasks); // Execute all tasks in order
		return this.init_promise;
	}

	/**
	 * Sets up default values and configurations for the view.
	 * @returns {Promise} A promise that resolves after list view settings are loaded.
	 */
	setup_defaults() {
		this.view = "BOM";

		// Initialize custom spreadsheet (JSpreadsheet) related data structure
		this.jss_det = this.initialize_jSS_details();

		// Route and title setup
		this.page_name = frappe.get_route_str();
		this.routes = frappe.get_route();
		this.part_ref = this.routes[3];
		this.page_title =
			this.page_title ||
			frappe.router.doctype_layout ||
			this.get_page_title() ||
			__(this.doctype);

		// Load metadata and user settings
		this.meta = frappe.get_meta(this.doctype); // Meta includes field definitions etc.
		this.settings = frappe.listview_settings[this.doctype] || {};
		this.user_settings = frappe.get_user_settings(this.doctype);

		// Prepare data and permissions
		this.data = [];
		this.method = "frappe.desk.cm_pages.bom.get_rfq_lineitems_with_alternates"; // API method to fetch data
		this.can_create = frappe.model.can_create(this.doctype); // Used to toggle create functionality

		// Initialize filters and fields
		this.fields = [];
		this.filters = [];

		// Placeholder for actions and menu items (can be configured later)
		// this.primary_action = null;
		// this.secondary_action = null;

		// Example menu item setup (currently not active)
		// this.menu_items = [
		// 	{
		// 		label: __("Refresh"),
		// 		action: () => this.refresh(),
		// 		class: "visible-xs",
		// 	},
		// ];

		// Load additional list view settings before completing defaults
		return this.get_list_view_settings().then(() => {
			return;
		});
	}

	/**
	 * Returns a custom page title if needed.
	 * Currently not implemented — serves as a placeholder for override.
	 * @returns {undefined}
	 */
	get_page_title() {
		return;
	}

	/**
	 * Fetches custom list view settings for the current doctype.
	 * This allows dynamic configuration for list views like filters, fields, etc.
	 * @returns {Promise<Object>} Resolves with the settings object.
	 */
	get_list_view_settings() {
		return frappe
			.call("frappe.desk.cm_pages.bom.get_list_settings", {
				doctype: this.doctype,
			})
			.then((doc) => (this.list_view_settings = doc.message || {}));
	}

	/**
	 * Sets up the main page structure and applies layout-related classes.
	 * Hides the form bar if configured.
	 */
	setup_page() {
		this.page = this.parent.page;
		this.$page = $(this.parent);
		this.page.main.addClass("layout-main-list");
		this.page.page_form.removeClass("row").addClass("flex");
		this.hide_page_form && this.page.page_form.hide();
		this.setup_page_head();
	}

	/**
	 * Initializes the page header: title, menu items, and breadcrumbs.
	 */
	setup_page_head() {
		this.set_title();
		this.set_menu_items();
		this.set_breadcrumbs();
	}

	/**
	 * Sets the page title based on available metadata.
	 */
	set_title() {
		this.page.set_title("BOM", null, true, "", this.meta?.description);
	}

	/**
	 * Adds menu items to the page, conditionally rendering based on visibility logic.
	 */
	set_menu_items() {
		this.refresh_button = this.page.add_action_icon(
			"es-line-reload",
			() => {
				this.refresh();
			},
			"",
			__("Reload List")
		);

		this.menu_items &&
			this.menu_items.map((item) => {
				if (item.condition && item.condition() === false) {
					return;
				}
				const $item = this.page.add_menu_item(
					item.label,
					item.action,
					item.standard,
					item.shortcut
				);
				if (item.class) {
					$item && $item.addClass(item.class);
				}
			});
	}

	/**
	 * Sets up breadcrumbs using the module and doctype info.
	 */
	set_breadcrumbs() {
		frappe.breadcrumbs.add(this.meta.module, this.doctype);
	}

	/**
	 * Prepares the main content section of the view by running setup tasks serially.
	 * Includes result containers, empty states, freeze loading indicators, etc.
	 * @returns {Promise}
	 */
	setup_main_section() {
		return frappe.run_serially(
			[
				this.setup_list_wrapper, // Container for list content
				this.setup_result_area, // Main results section
				this.setup_no_result_area, // Message when no results found
				this.setup_freeze_area, // Loading state section
				this.setup_paging_area, // Pagination control area
			].map((fn) => fn.bind(this))
		);
	}

	/**
	 * Initializes the wrapper DOM for the list section.
	 */
	setup_list_wrapper() {
		this.$frappe_list = $('<div class="frappe-list">').appendTo(this.page.main);
	}

	/**
	 * Initializes the main result section container.
	 */
	setup_result_area() {
		this.$result = $(`<div class="result">`);
		this.$frappe_list.append(this.$result);
	}

	/**
	 * Initializes the "no results found" UI section.
	 */
	setup_no_result_area() {
		this.$no_result = $(` 
		<div class="no-result text-muted flex justify-center align-center">
			${this.get_no_result_message()}
		</div>
	`).hide();
		this.$frappe_list.append(this.$no_result);
	}

	/**
	 * Returns a message for when there are no records to display.
	 * @returns {string} The localized empty-state message.
	 */
	get_no_result_message() {
		// TODO: P4 — Make this dynamic or configurable if needed
		return __("Nothing to show");
	}

	/**
	 * Sets up the freeze/loading overlay shown while fetching data.
	 */
	setup_freeze_area() {
		this.$freeze = $(`
		<div class="freeze flex justify-center align-center text-muted">
			${__("Loading")}...
		</div>
	`).hide();
		this.$result.append(this.$freeze);
	}

	/**
	 * Initializes the pagination controls for the list view.
	 */
	setup_paging_area() {
		this.$paging_area = $(`
		<div class="list-paging-area level">
			<div class="level-left"></div>
			<div class="level-right"></div>
		</div>
	`).hide();
		this.$frappe_list.append(this.$paging_area);
	}

	/**
	 * Final step of setting up the view: mounts spreadsheet container,
	 * sets up columns, event listeners, and triggers any `onload` handlers.
	 */
	setup_view() {
		this.init_jss_container(); // Initialize JSpreadsheet container
		this.setup_columns(); // Define table columns
		// this.render_header();       // Optional: render column headers
		// this.render_skeleton();     // Optional: show loading skeleton
		this.setup_events(); // Bind custom event handlers

		// Trigger optional onload logic from settings
		this.settings.onload && this.settings.onload(this);
	}
	//#endregion Setup Page Related Functions

	//#region Fetch data and pass it to the JSpreadsheet-related function
	/**
	 * Build the arguments for server call.
	 */
	get_args() {
		return {
			doctype: this.doctype,
			part_ref: this.part_ref,
			// fields, filters, order_by, pagination, etc., can be added as needed
		};
	}

	/**
	 * Prevents making the same call repeatedly within 3 seconds.
	 * @param {*} args
	 * @returns {boolean}
	 */
	no_change(args) {
		if (this.last_args && JSON.stringify(args) === this.last_args) {
			return true;
		}
		this.last_args = JSON.stringify(args);
		setTimeout(() => {
			this.last_args = null;
		}, 3000);
		return false;
	}

	/**
	 * Wrapper to return frappe.call parameters.
	 * @returns {Object}
	 */
	get_call_args() {
		const args = this.get_args();
		return {
			method: this.method,
			args,
			freeze: this.freeze_on_refresh || false,
			freeze_message: this.freeze_message || __("Loading") + "...",
		};
	}

	/**
	 * Refresh the list view by fetching data from the server.
	 * @returns {Promise}
	 */
	refresh() {
		const args = this.get_call_args();

		if (this.no_change(args)) {
			return Promise.resolve(); // Prevent duplicate calls
		}

		return frappe.call(args).then((r) => {
			this.prepare_data(r);
			this.toggle_result_area();
			this.render();
			this.set_result_height();

			if (this.settings.refresh) {
				this.settings.refresh(this);
			}
		});
	}

	/**
	 * Process and assign data returned from server.
	 * @param {*} r - Response from the server
	 */
	prepare_data(r) {
		this.data = this.prepare_jss_data(r.message) || [];
	}

	/**
	 * how or hide result/no-result containers based on data length.
	 */
	toggle_result_area() {
		this.$result.toggle(this.data.length > 0);
		this.$no_result.toggle(this.data.length === 0);
	}

	/**
	 * Render the data in list view.
	 */
	render() {
		if (this.jss_det.isSpreadsheetInitialized) {
			this.handle_list_data_update(); // Update the already-initialized spreadsheet
		} else {
			// Check if JSpreadsheet is loaded and the license is valid
			if (typeof jspreadsheet !== "undefined" && this.jss_license_loaded) {
				this.init_spreadsheet(); // Initialize immediately
				return;
			}

			// Wait for JSpreadsheet to load, check every 500ms
			const checkSpreadsheet = setInterval(() => {
				if (typeof jspreadsheet !== "undefined" && this.jss_license_loaded) {
					clearInterval(checkSpreadsheet); // Stop checking once available
					this.init_spreadsheet();
				}
			}, 500);
		}
	}
	//#endregion Fetch data and pass it to the JSpreadsheet-related function

	//#region Setup Events
	/**
	 * Sets up event handlers for the page.
	 */
	setup_events() {
		this.setup_body_sidebar_change_event();
	}
	/**
	 * Attaches a delegated event listener to the sidebar collapse link.
	 * When clicked, it updates the viewport to adjust for sidebar changes.
	 */
	setup_body_sidebar_change_event() {
		$(".body-sidebar").on("click", ".collapse-sidebar-link", this.set_jss_viewport.bind(this));
	}
	//#endregion Setup Events

	//#region Jspreadsheet utility functions
	/**
	 * Get the column name (e.g., A, B, C...) based on its index.
	 *
	 * @param {*} index - The zero-based index of the column.
	 * @returns {string} - The corresponding Excel-style column name.
	 */
	get_column_name_by_idx(index) {
		return jspreadsheet.helpers.getColumnName(index);
	}
	//#endregion Jspreadsheet utility functions

	//#region Manage spreadsheet height
	/**
	 * Adjusts the height of the result and no-result containers
	 * to fill the remaining window space dynamically.
	 */
	set_result_height() {
		this.$result.css({
			height:
				window.innerHeight -
				this.$result.get(0).offsetTop -
				this.$paging_area.get(0).offsetHeight +
				"px",
		});

		this.$no_result.css({
			height: window.innerHeight - this.$no_result.get(0).offsetTop + "px",
		});
	}

	/**
	 * Calculates and updates the viewport dimensions for JSpreadsheet.
	 * It adjusts the table height and width based on window size and UI elements.
	 */
	cal_viewport() {
		this.jss_det.tableHeight =
			window.innerHeight - // Total window height
			this.$result.get(0).offsetTop - // Offset from the top
			(this.$paging_area?.get(0).offsetHeight || 0) - // Paging area height (if present)
			10; // Additional spacing adjustment

		this.jss_det.tableWidth =
			window.innerWidth - // Total window width
			// (this.list_sidebar?.sidebar?.get(0)?.offsetWidth || 0) - // Sidebar width (if present)
			this.$result?.get(0)?.offsetLeft - // Offset from the left
			15; // Additional spacing adjustment
	}

	/**
	 * Sets the JSpreadsheet viewport dimensions dynamically.
	 * Calls `cal_viewport()` to update dimensions and applies them if they have changed.
	 */
	set_jss_viewport() {
		this.cal_viewport(); // Recalculate viewport dimensions

		if (
			this.jss_instance[0]?.element?.offsetWidth !== this.jss_det.tableWidth ||
			this.jss_instance[0]?.element?.offsetHeight !== this.jss_det.tableHeight
		) {
			// Apply new viewport dimensions if they have changed
			this.jss_instance[0]?.setViewport(this.jss_det.tableWidth, this.jss_det.tableHeight);
		}
	}

	/**
	 * Handles window resize events with debouncing to prevent frequent calls.
	 * Updates the JSpreadsheet viewport only after 300ms delay.
	 */
	onResize = frappe.utils.debounce(() => {
		this.set_jss_viewport();
	}, 300);
	//#endregion Manage spreadsheet height

	//#region JSpreadsheet Header related functions.
	/**
	 * Setup the columns to be shown in the list view.
	 */
	setup_columns() {
		this.columns = [...this.list_view_settings];

		this.prepare_jss_source_header();
	}

	/**
	 * Prepares the column definitions for JSpreadsheet based on the data type of the Doctype.
	 */
	prepare_jss_source_header() {
		// Ensure columns are available before proceeding
		if (!this.columns) return;
		this.jss_det.validListFields = new Set(); // Use Set for faster lookups
		// Define hidden columns for internal use
		const hiddenColumns = [
			{ name: "_otherDet", type: "hidden" },
			// { name: "_rowCheckbox", type: "checkbox", width: 38 },
		];
		// Transform columns into JSpreadsheet format
		const visibleColumns = this.columns.map((col) => {
			this.jss_det.validListFields.add(col.fieldname); // We can change the logic of validListFields whenever needed.
			return {
				name: col.fieldname,
				title: col.label,
				type: col.type || "text", // Default type as text, can be overridden
				width: +col.width || 200, // Default width
				wrap: true, // Enable wrapping by default,
				cmMeta: col,
			};
		});
		// Combine hidden and visible columns
		this.jss_det.columns = [...hiddenColumns, ...visibleColumns];
		this.store_header_and_merge_col_idx();
	}

	/**
	 * Stores the index of each column in the `columnsIdx` object for quick lookup.
	 * This improves performance when accessing column positions by name.
	 */
	store_header_and_merge_col_idx() {
		const { columns } = this.jss_det;
		const columnsIdx = {};
		const mergeColDet = [];
		const get_column_name_by_idx = this.get_column_name_by_idx.bind(this);

		for (let i = 0, len = columns.length; i < len; i++) {
			const column = columns[i];
			columnsIdx[column.name] = i;

			if (column?.cmMeta?.isMergeCol) {
				mergeColDet.push(get_column_name_by_idx(i));
			}
		}

		// Update only once to avoid redundant operations
		this.jss_det.columnsIdx = columnsIdx;
		this.jss_det.mergeColDet = mergeColDet;
	}

	//#endregion JSpreadsheet Header related functions.

	//#region Manage JSpreadsheet Data related functions.
	/**
	 * Prepares and assigns the data to the JSpreadsheet instance.
	 * It separates valid fields from additional fields into an `otherDet` object.
	 */
	prepare_jss_data(data = []) {
		const { validListFields, mergeColDet, mergeCellDet } = this.jss_det;

		return data.map((row, rowIndex) => {
			const formattedRow = Object.create(null);
			const otherDet = (formattedRow._otherDet = Object.create(null));

			// Pre-check mergeRowCount once
			const mergeCount = row.mergeRowCount;

			for (const key in row) {
				const target = validListFields.has(key) ? formattedRow : otherDet;
				target[key] = row[key];
			}

			// Apply merging if needed
			if (mergeCount > 1) {
				for (let i = 0; i < mergeColDet.length; i++) {
					const key = mergeColDet[i] + (rowIndex + 1);
					mergeCellDet[key] = [1, mergeCount];
				}
			}

			return formattedRow;
		});
	}

	/**
	 * Updates the JSpreadsheet instance with new data.
	 */
	update_jss_data(updatedData, adjustDimension) {
		this.jss_instance[0].loadData(updatedData, adjustDimension);
	}

	/**
	 * Apply merged cell settings to the JSS instance.
	 */
	set_merge(mergeCellDet) {
		this.jss_instance[0].setMerge(mergeCellDet || this.jss_det.mergeCellDet);
	}

	/**
	 * Handles refreshing the data update.
	 */
	handle_list_data_update() {
		const jss = this.jss_instance[0];

		// Preserve current visible row and column
		const currentVisibleRow = jss.visibleRows?.[0] ?? 0;
		const currentVisibleCol = jss.visibleCols?.[0] ?? 0;

		// Update JSpreadsheet data and reapply row selection
		this.update_jss_data(this.data, true);
		this.set_merge();

		// this.handle_row_selection_after_data_update();

		// Restore previous scroll position
		jss.goto(currentVisibleRow, currentVisibleCol);

		// this.freeze(false);
	}
	//#endregion Manage JSpreadsheet Data related functions.

	//#region Init JSpreadsheet related functions.
	/**
	 * Initializes JSpreadsheet-related configuration and data.
	 * @returns {Object} JSpreadsheet configuration with default values.
	 */
	initialize_jSS_details() {
		return {
			columns: [], // Stores column configurations
			columnsIdx: {}, // Maps column names to their indexes (for internal use)
			validListFields: new Set(), // Stores valid default list field names. (for internal use)
			data: [], // Holds spreadsheet data
			tableWidth: 800, // Default spreadsheet width
			tableHeight: 500, // Default spreadsheet height
			isSpreadsheetInitialized: undefined, // Store boolean value for the spreadsheet is initialized or not.
			mergeColDet: [],
			mergeCellDet: {},
		};
	}

	/**
	 * Initializes the JSpreadsheet instance.
	 * This function sequentially executes required setup steps using `frappe.run_serially()`.
	 */
	init_spreadsheet() {
		// NOTE: We can add here more function which is related to jspreadsheet initialized./ NOTE: Additional functions related to JSpreadsheet initialization can be added here.
		this.render_spreadsheet();
	}

	/**
	 * Creates a container element for JSpreadsheet and appends it to the result container.
	 */
	init_jss_container() {
		this.$jss_parent_container = $('<div class="cm-jss-parent-container"></div>')
			.append((this.$jss_container = $('<div id="cm-jss-container"></div>')))
			.appendTo(this.$result);
	}

	/**
	 * Initializes and renders the JSpreadsheet instance inside the designated container.
	 * It calculates the viewport size and sets up JSpreadsheet with the required configurations.
	 */
	render_spreadsheet() {
		this.cal_viewport(); // Calculate the viewport dimensions

		// Initialize JSpreadsheet with defined settings
		this.jss_instance = jspreadsheet(this.$jss_container.get(0), {
			// Using an arrow function in multiple functions below to preserve the 'this' context from CmlistjssView.
			// This prevents 'this' keyword from referring to JSpreadsheet inside those functions, ensuring access to class methods.
			autoCasting: false,
			loadingSpin: true,
			validations: this.jss_det.validations,
			contextMenu: function () {
				return false;
			},
			// onchange: (...args) => this.onchange(...args),
			// oncreatecolumn: (...args) => this.oncreatecolumn(...args),
			// onbeforesort: (...args) => this.onbeforesort(...args),
			// onafterchanges: (...args) => this.onafterchanges(...args),
			worksheets: [
				{
					data: this.data,
					columns: this.jss_det.columns,
					tableOverflow: true,
					resize: "both",
					minDimensions: [0, 0], // Minimum table size
					tableWidth: this.jss_det.tableWidth,
					tableHeight: this.jss_det.tableHeight,
					columnSorting: false,
					// allowManualInsertRow: false,
					// allowManualInsertColumn: false,
					mergeCells: this.jss_det.mergeCellDet,
				},
			],
		});
		this.jss_det.isSpreadsheetInitialized = true;
		// this.freeze(false);

		// this.add_custom_log("3: Spreadsheet initialized!");
	}
	//#endregion Init JSpreadsheet related functions.
};
