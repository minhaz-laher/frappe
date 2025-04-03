frappe.provide("frappe.views");

frappe.views.CmlistjssView = class CmlistjssView extends frappe.views.ListView {
	/**
	 * Getter function to return the view name.
	 * This helps identify the custom view.
	 */
	get view_name() {
		return "Cmlistjss";
	}

	/**
	 * Constructor function to initialize the view.
	 * - Loads required assets.
	 * - Binds the resize event.
	 * - Sets up route change listener for cleanup.
	 *
	 * @param {Object} opts - Options passed to the view.
	 */
	constructor(opts) {
		super(opts);
		// Load required assets for JSpreadsheet.
		this.loadAssets();

		// Prepare an index-function mapping for click events inside JSpreadsheet.
		this.prepare_cm_idx_fn_mapping_det();
		this._jss_element_factory = new JssElementFactory();

		// Bind the `this` context to onResize and add the event listener.
		this.onResize = this.onResize.bind(this);
		window.addEventListener("resize", this.onResize);

		this.allowToAddCustomLog = true;
		this.disable_jss_list_update = true; // If true, the JSpreadsheet list will not update on a socket I/O call.

		// Note: Commented out the above code due to issues in cleanup.
		// // Listen for page changes and execute cleanup.
		// this.routeChangeHandler = () => this.cleanup();
		// frappe.router.on("change", this.routeChangeHandler);
	}

	/**
	 * Crated method for debugging purpose.
	 */
	add_custom_log(...args) {
		if (this.allowToAddCustomLog) {
			console.log("CM:", ...args);
		}
	}

	//#region Load JSpreadsheet assets and their license.
	/**
	 * Asynchronously loads the required JSpreadsheet assets (JS and CSS files).
	 * Note: We can load css throgh "hooks.py" also.
	 */
	async loadAssets() {
		try {
			// Load JavaScript files required for JSpreadsheet.
			const jsFiles = await this.loadFilesFromDirectory("/assets/frappe/js/jss/", "js");
			await Promise.all(jsFiles.map((file) => this.loadJs(file)));

			// Load CSS files required for styling JSpreadsheet.
			const cssFiles = await this.loadFilesFromDirectory("/assets/frappe/css/jss/", "css");
			await Promise.all(cssFiles.map((file) => this.loadCss(file)));

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
	 * Dynamically loads a CSS file and appends it to the document head.
	 *
	 * @param {string} href - The URL of the CSS file.
	 * @returns {Promise} Resolves when the CSS file is loaded.
	 */
	loadCss(href) {
		return new Promise((resolve, reject) => {
			// Check if the CSS file is already loaded.
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
				css: [
					"jspreadsheet.css",
					"jsuites.css",
					"jspreadsheet.themes.css",
					"cm-style.css",
				],
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

	//#region Override parent methods to achieve desired functionality in the JSpreadsheet view.
	/**
	 * Overrides the parent method
	 * @returns
	 */
	setup_defaults() {
		this.view = "Cmlistjss"; // We can change view name here.
		this.jss_det = this.initialize_jSS_details(); // Initialize JSpreadsheet-related data
		return super.setup_defaults().then((r) => {
			return r; // IN:: We can improve this syntax. The currently added syntax is just for testing purposes."
		});
	}

	/**
	 * Overrides the parent method
	 */
	setup_view() {
		this.init_jss_container();
		this.setup_columns();
		this.settings.onload && this.settings.onload(this);
		this.show_restricted_list_indicator_if_applicable();
		this.setup_events();
	}

	/**
	 * Overrides the parent method to setup events.
	 */
	setup_events() {
		this.setup_body_sideber_change_event();
		this.jss_handle_clickable_content();
	}

	/**
	 * Overrides the parent method to set up columns for the JSpreadsheet view.
	 * All logic references are taken from the parent setup_columns function
	 */
	setup_columns() {
		// setup columns for list view
		this.columns = [];

		const get_df = frappe.meta.get_docfield.bind(null, this.doctype);

		// 1st column: title_field or name
		if (this.meta.title_field) {
			this.columns.push({
				type: "Subject",
				df: get_df(this.meta.title_field),
			});
		} else {
			this.columns.push({
				type: "Subject",
				df: {
					label: __("ID"),
					fieldname: "name",
				},
			});
		}

		// IN:: Pending to implement
		// 3rd column: Status indicator
		// if (frappe.has_indicator(this.doctype)) {
		// 	// indicator
		// 	this.columns.push({
		// 		type: "Status",
		// 	});
		// }

		const fields_in_list_view = this.get_fields_in_list_view();
		// Add rest from in_list_view docfields
		this.columns = this.columns.concat(
			fields_in_list_view
				.filter((df) => {
					if (frappe.has_indicator(this.doctype) && df.fieldname === "status") {
						return false;
					}
					if (!df.in_list_view || df.is_virtual) {
						return false;
					}
					return df.fieldname !== this.meta.title_field;
				})
				.map((df) => ({
					type: "Field",
					df,
				}))
		);

		if (this.list_view_settings.fields) {
			this.columns = this.reorder_listview_fields();
		}

		if (
			!this.settings.hide_name_column &&
			this.meta.title_field &&
			this.meta.title_field !== "name"
		) {
			this.columns.push({
				type: "Field",
				df: {
					label: __("ID"),
					fieldname: "name",
				},
			});
		}

		this.prepare_jss_source_header();
	}

	/**
	 * Overridden method to disable header rendering.
	 * The parent implementation is not needed for this view.
	 *
	 * @param {boolean} refresh_header - Flag to determine if the header should be refreshed.
	 */
	render_header(refresh_header = false) {
		// Note: This method is intentionally overridden as the parent implementation is not needed.
	}

	/**
	 * Overridden method to disable the count rendering.
	 * The parent implementation is not needed for this view.
	 */
	render_count() {
		// Note: This method is intentionally overridden as the parent implementation is not needed.
	}

	/**
	 * Overridden method to disable the checkbox update.
	 * The parent implementation is not needed for this view.
	 */
	update_checkbox() {
		// Note: This method is intentionally overridden as the parent implementation is not needed.
	}

	/**
	 * Sets the height of the result container by calling the parent method.
	 */
	set_result_height() {
		super.set_result_height();
	}

	/**
	 * Overrides the parent method to prepare the data object.
	 * @param {*} r - The response object containing the data to be processed.
	 */
	prepare_data(r) {
		let data = r.message || {};
		this.add_custom_log("3: prepare_data fn called");

		// extract user_info for assignments
		Object.assign(frappe.boot.user_info, data.user_info);
		delete data.user_info;

		data = !Array.isArray(data) ? frappe.utils.dict(data.keys, data.values) : data;

		if (this.start === 0) {
			this.data = this.prepare_jss_data(data.uniqBy((d) => d.name));
		} else {
			this.data = this.get_jss_data()
				.concat(this.prepare_jss_data(data))
				.uniqBy((d) => d.name);
		}
	}

	/**
	 * Overrides the parent method to render the JSpreadsheet instance.
	 *
	 * - Removes any existing JSpreadsheet container to prevent duplication.
	 * - If JSpreadsheet is already loaded and licensed, it initializes immediately.
	 * - If not, it sets an interval to periodically check for JSpreadsheet's availability and initializes it once it is loaded.
	 */
	render_list() {
		// Check if the spreadsheet is already initialized,  as the "render" method can be called on data updates as well.
		if (this.jss_det.isSpreadsheetInitialized) {
			this.handle_list_data_update();
		} else {
			// Check if JSpreadsheet is already loaded and the license is valid
			if (typeof jspreadsheet !== "undefined" && this.jss_license_loaded) {
				this.init_spreadsheet(); // Initialize the spreadsheet immediately
				return;
			}

			// If JSpreadsheet is not yet available, set an interval to check periodically
			const checkSpreadsheet = setInterval(() => {
				// Once JSpreadsheet is loaded and the license is available, initialize it
				if (typeof jspreadsheet !== "undefined" && this.jss_license_loaded) {
					clearInterval(checkSpreadsheet); // Stop checking once loaded
					this.init_spreadsheet();
				}
			}, 500); // Check every 500ms
		}
	}

	/**
	 * Overrides the parent method.
	 * Processes pending document refreshes when the user is on the list view.
	 */
	process_document_refreshes() {
		this.add_custom_log("2: process_document_refreshes fn called!");
		if (!this.pending_document_refreshes.length) return;

		const route = frappe.get_route() || [];
		if (!cur_list || route[0] != "List" || cur_list.doctype != route[1]) {
			// wait till user is back on list view before refreshing
			this.pending_document_refreshes = [];
			this.disable_realtime_updates();
			return;
		}

		const names = this.pending_document_refreshes.map((d) => d.name);
		this.pending_document_refreshes = this.pending_document_refreshes.filter(
			(d) => names.indexOf(d.name) === -1
		);

		if (!names.length) return;

		// filters to get only the doc with this name
		const call_args = this.get_call_args();
		call_args.args.filters.push([this.doctype, "name", "in", names]);
		call_args.args.start = 0;

		frappe.call(call_args).then(({ message }) => {
			if (!message) return;
			const data = frappe.utils.dict(message.keys, message.values);

			const jssData = [...this.data];

			data.forEach((datum) => {
				const index = jssData.findIndex((doc) => doc.name === datum.name);

				if (index === -1) {
					// append new data
					jssData.push(datum);
				} else {
					// update this data in place
					jssData[index] = datum;
				}
			});

			jssData.sort((a, b) => {
				const a_value = a[this.sort_by] || "";
				const b_value = b[this.sort_by] || "";

				let return_value = 0;
				if (a_value > b_value) {
					return_value = 1;
				}

				if (b_value > a_value) {
					return_value = -1;
				}

				if (this.sort_order === "desc") {
					return_value = -return_value;
				}
				return return_value;
			});

			this.data = jssData;

			this.toggle_result_area();
			this.render_list();
		});
	}

	/**
	 * Overrides the parent set_rows_as_checked method.
	 */
	set_rows_as_checked() {
		// Note: This method is intentionally overridden as the parent implementation is not needed.
	}

	/**
	 * Toggles the visibility of the primary action button or the actions menu(Top right corner of list page).
	 */
	toggle_actions_menu_button(toggle) {
		super.toggle_actions_menu_button(toggle);
	}

	/**
	 * Retrieves the checked items from the spreadsheet.
	 * Overrides the parent function to provide custom behavior.
	 *
	 * @param {boolean} only_docnames - If true, returns only the document names.
	 * @returns {Array} - An array of document names if `only_docnames` is true,
	 *                    otherwise, an array of objects containing the checked rows.
	 */
	get_checked_items(only_docnames) {
		const docnames = this.jss_det.checked_row_det;

		if (only_docnames) return docnames;

		const listData = this.data.map(({ _otherDet, ...rest }) => ({
			...rest,
			..._otherDet,
		}));

		return listData;
	}

	/**
	 * Clears all checked items.
	 * Overrides the parent function to provide custom behavior.
	 */
	clear_checked_items() {
		this.handle_header_checkbox_change(null, false, null);
	}

	/**
	 * Toggles the sidebar visibility and updates the JSpreadsheet viewport.
	 *
	 * @param {boolean} show - Indicates whether to show or hide the sidebar.
	 */
	toggle_side_bar(show) {
		super.toggle_side_bar(show);
		this.set_jss_viewport();
	}

	/**
	 * Determines whether real-time updates should be avoided.
	 */
	avoid_realtime_update() {
		if (this.jss_det.checked_row_det?.length > 0 || this.disable_jss_list_update) {
			return true;
		}

		return super.avoid_realtime_update();
	}
	//#endregion Override parent methods to achieve desired functionality in the JSpreadsheet view.

	//#region Setup Events
	/**
	 * Attaches a delegated event listener to the sidebar collapse link.
	 * When clicked, it updates the viewport to adjust for sidebar changes.
	 */
	setup_body_sideber_change_event() {
		$(".body-sidebar").on("click", ".collapse-sidebar-link", this.set_jss_viewport.bind(this));
	}

	/**
	 * Handles click event on long text field buttons.
	 */
	handle_long_text_field_button_click(e, x, y) {
		const value = this.get_value_from_coords(x, y);

		// We will use custom dialog in future.
		frappe.msgprint({
			title: __("Information"),
			message: __(value),
			indicator: "blue",
		});
	}

	/**
	 * Handles click event on link fields.
	 */
	handle_link_field_click(e, x, y) {
		const value = this.get_value_from_coords(x, y);
		frappe.set_route("Form", this.doctype, value);
	}

	/**
	 * Handles click events on dynamic elements using event delegation.
	 */
	jss_handle_clickable_content() {
		this.$jss_parent_container.on("click", ".cm-clickable-content", (e) => {
			const keyIdx = e.currentTarget.dataset.keyIdx;
			const { x, y } = e.target.closest("td")?.dataset;

			this.cmIdxFnMappingDet[+keyIdx]?.handlerFn(e, +x, +y);
		});
	}

	//#endregion Setup Events

	//#region Row checkboxes and the action menu functions.
	/**
	 * Handles the change event for a row checkbox, updating the checked row details accordingly.
	 * @param {number} rowIdx - Index of the row in the dataset.
	 * @param {boolean} newValue - Whether the checkbox is checked (true) or unchecked (false).
	 */
	handle_row_checkbox_change(rowIdx, newValue) {
		const recordName = this.get_jss_row_data(rowIdx)?.name;
		if (!recordName) return;

		const checkedRows = this.jss_det.checked_row_det;
		const index = checkedRows.indexOf(recordName);

		if (newValue) {
			// Add only if not already present
			index === -1 && checkedRows.push(recordName);
		} else if (index !== -1) {
			// Remove without using bitwise NOT for better readability
			checkedRows.splice(index, 1);
		}

		// Update header checkbox and action menu
		this.update_header_checkbox();
		this.toggle_actions_menu_button(this.jss_det.checked_row_det.length > 0);
	}

	/**
	 * Binds a checkbox to the column header cell, replacing any existing content.
	 * This checkbox is used to select/deselect all rows.
	 *
	 * @param {Object} worksheet - Worksheet instance.
	 * @param {HTMLElement} td - The column header cell where the checkbox will be added.
	 */
	bind_header_checkbox(worksheet, td) {
		// Clear existing content in the column header cell
		td.textContent = "";

		// Create and configure checkbox element
		const headerCheckbox = Object.assign(document.createElement("input"), {
			type: "checkbox",
			className: "cm-header-checkbox",
		});

		// Store the checkbox reference
		this.jss_det.$header_checkbox = headerCheckbox;

		// Bind click event to handle checkbox state change
		headerCheckbox.addEventListener("click", (e) =>
			this.handle_header_checkbox_change(e, e.target.checked, worksheet)
		);

		// Append the checkbox to the column header cell
		td.appendChild(headerCheckbox);
	}

	/**
	 * Handles the state change of the header checkbox.
	 * Selects or deselects all rows based on the checkbox state.
	 *
	 * @param {Event} e - The event object from the checkbox click.
	 * @param {Object} worksheet - The worksheet instance.
	 */
	handle_header_checkbox_change(e, isChecked, worksheet) {
		if (!worksheet) {
			worksheet = this.jss_instance[0];
		}
		// Fill the entire column with true or false based on the checkbox state
		worksheet.setColumnData(
			this.jss_det.columnsIdx._rowCheckbox,
			Array(worksheet.rows.length).fill(isChecked)
		);

		// Update the logic below if:
		// 1. Implementing a client-side filter on JSS
		// 2. Making the row checkbox read-only in any case
		this.jss_det.checked_row_det = isChecked
			? worksheet.getColumnData(this.jss_det.columnsIdx.name)
			: [];
	}

	/**
	 * Updates the state of the header checkbox based on selected rows.
	 * If all rows are selected, the checkbox is checked; otherwise, it's unchecked.
	 */
	update_header_checkbox() {
		if (this.jss_det.$header_checkbox) {
			const rowCount = this.get_rows_count();
			this.jss_det.$header_checkbox.checked =
				rowCount > 0 && rowCount === this.jss_det.checked_row_det.length;
		}
	}

	/**
	 * Handles row selection updates after data modification.
	 */
	handle_row_selection_after_data_update() {
		if (this.start === 0) {
			// Retrieve the latest JSS data
			const jss_data = this.get_jss_data() || [];
			const { checked_row_det, columnsIdx } = this.jss_det;

			// Determine which checked rows still exist and which should be removed
			const { updateRowCheckboxDet, removeCheckedRowDet } = checked_row_det.reduce(
				(acc, docName, i) => {
					const rowIdx = jss_data.findIndex((row) => row.name === docName);
					rowIdx === -1
						? acc.removeCheckedRowDet.push(i) // Row no longer exists, mark for removal
						: acc.updateRowCheckboxDet.push(rowIdx); // Row exists, mark for checkbox update
					return acc;
				},
				{ updateRowCheckboxDet: [], removeCheckedRowDet: [] }
			);

			// Remove invalid checked rows in reverse order for efficient deletion
			for (let i = removeCheckedRowDet.length - 1; i >= 0; i--) {
				checked_row_det.splice(removeCheckedRowDet[i], 1);
			}

			// Update checkbox states for remaining checked rows
			updateRowCheckboxDet.forEach((rowIdx) => {
				this.set_value_from_coords(columnsIdx._rowCheckbox, rowIdx, true, true);
			});
		} else {
			// Update the header checkbox and toggle action menu based on row selection
			this.update_header_checkbox();
			this.toggle_actions_menu_button(this.jss_det.checked_row_det.length > 0);
		}
	}
	//#endregion Row checkboxes and the action menu functions.

	//#region Manage spreadsheet height
	/**
	 * Calculates and updates the viewport dimensions for JSpreadsheet.
	 * It adjusts the table height and width based on window size and UI elements.
	 */
	cal_viewport() {
		this.jss_det.tableHeight =
			window.innerHeight - // Total window height
			this.$result.get(0).offsetTop - // Offset from the top
			(this.$paging_area?.get(0).offsetHeight || 0) - // Paging area height (if present)
			5; // Additional spacing adjustment

		this.jss_det.tableWidth =
			window.innerWidth - // Total window width
			(this.list_sidebar?.sidebar?.get(0)?.offsetWidth || 0) - // Sidebar width (if present)
			this.$result?.get(0)?.offsetLeft - // Offset from the left
			5; // Additional spacing adjustment
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
		super.set_result_height();
	}, 300);
	//#endregion Manage spreadsheet height

	//#region Spreadsheet helper functions
	/**
	 * Destroy the existing sheet.
	 */
	destroty_sheet() {
		jspreadsheet.destroy(this.jss_instance[0].parent.el, true);
	}

	/**
	 * Retrieves the total number of rows in the JSpreadsheet instance.
	 * @returns {number} The count of rows currently present in the spreadsheet.
	 */
	get_rows_count() {
		return this.jss_instance[0].rows.length;
	}
	//#endregion Spreadsheet helper functions

	//#region Save data related functions
	// /**
	//  * Saves a cell value to the database if the field is valid.
	//  *
	//  * @param {number} x - Column index.
	//  * @param {number} y - Row index.
	//  * @param {string|number} value - The value to save.
	//  * @returns {Promise<any>} Resolves with the updated document or rejects on failure.
	//  */
	// async save_cell_value(x, y, value) {
	// 	try {
	// 		const fieldname = this.jss_instance[0]?.getProperties(x, y)?.name;

	// 		// Check if the field is valid for saving
	// 		if (!this.jss_det.validListFields.has(fieldname)) return;

	// 		const docname = this.get_value_from_coords(this.jss_det.columnsIdx.name, y);

	// 		// Update value in the database
	// 		const response = await frappe.db.set_value(this.doctype, docname, {
	// 			[fieldname]: value,
	// 		});

	// 		// Return the message if successful
	// 		if (response?.message) {
	// 			return response.message;
	// 		} else {
	// 			throw new Error("Failed to update value.");
	// 		}
	// 	} catch (error) {
	// 		console.error("Error saving cell value:", error);
	// 		throw error;
	// 	}
	// }

	/**
	 * Saves multiple records in parallel.
	 *
	 * @param {Array<{x: number, y: number, value: string|number}>} records - List of records to update.
	 * @returns {Promise<void>}
	 */
	async handle_save_records(records) {
		// try {
		// 	// Run all updates in parallel using Promise.all()
		// 	await Promise.all(
		// 		records.map(({ x, y, value }) => this.save_cell_value(+x, +y, value))
		// 	);
		// } catch (error) {
		// 	console.error("Error saving records:", error);
		// }
	}

	//#endregion Save data related functions

	//#region Customize cell render related functions.
	/**
	 * Prepare an index-function mapping for click events inside JSpreadsheet.
	 *
	 * Note: For all custom renderers and click handlers, we will bind a single click event on JSS using event delegation.
	 * During a click event, we avoid if-else or switch cases by mapping indexes to functions, ensuring the appropriate function is called based on the index.
	 */
	prepare_cm_idx_fn_mapping_det() {
		this.cmIdxFnMappingDet = {
			1: { handlerFn: this.handle_long_text_field_button_click.bind(this) },
			2: { handlerFn: this.handle_link_field_click.bind(this) },
		};
	}

	/**
	 * Renders a long text field in the cell by delegating to `JssElementFactory`'s `cm_render_long_text_element` method.
	 *
	 * @param {HTMLElement} td - The cell to render the value in.
	 * @param {number|string} value - The value to display.
	 * @param {number} x - The row index.
	 * @param {number} y - The column index.
	 * @param {worksheetInstance} instance - The worksheet instance.
	 * @param {Column} options - Column options (width, type, etc.).
	 */
	cm_render_long_text_element(td, value, x, y, instance, options) {
		// Delegate to JssElementFactory's method for rendering long text
		this._jss_element_factory.cm_render_long_text_element(td, value, x, y);
	}

	/**
	 * Renders a link element.
	 *
	 * @param {HTMLElement} td - The cell to render the value in.
	 * @param {number|string} value - The value to display.
	 * @param {number} x - The row index.
	 * @param {number} y - The column index.
	 * @param {worksheetInstance} instance - The worksheet instance.
	 * @param {Column} options - Column options (width, type, etc.).
	 */
	cm_render_link_element(td, value, x, y, instance, options) {
		// Delegate to JssElementFactory's method for rendering long text
		this._jss_element_factory.cm_render_link_element(td, value, x, y);
	}
	//#endregion Customize cell render related functions.

	//#region JSpreadsheet events
	/**
	 * Handles cell value changes in the worksheet.
	 *
	 * @param {Object} worksheet - Worksheet instance.
	 * @param {HTMLElement} cell - Modified cell element.
	 * @param {number|string} x - Column index.
	 * @param {number|string} y - Row index.
	 * @param {*} newValue - Updated cell value.
	 * @param {*} oldValue - Previous cell value.
	 */
	onchange(worksheet, cell, x, y, newValue, oldValue) {
		if (+x === this.jss_det.columnsIdx._rowCheckbox) {
			this.handle_row_checkbox_change(+y, newValue);
		}
	}

	/**
	 * Triggered after all data is updated.
	 * @param {*} worksheet - Worksheet instance.
	 * @param {*} records - Changed cell records.
	 * @param {*} origin - Change source ('paste', 'handle-fill', or undefined).
	 */
	onafterchanges(worksheet, records, origin) {
		this.handle_save_records(records);
	}

	/**
	 * Called when a new column is created.
	 *
	 * @param {Object} worksheet - Worksheet instance.
	 * @param {number} columnNumber - Column index.
	 * @param {HTMLElement} td - Column header cell.
	 * @param {Object} options - Column settings.
	 */
	oncreatecolumn(worksheet, columnNumber, td, options) {
		if (+columnNumber === this.jss_det.columnsIdx._rowCheckbox) {
			this.bind_header_checkbox(worksheet, td);
		}
	}

	/**
	 * Pre-sorting handler. Cancels sorting for the row selection checkbox column.
	 *
	 * @param {Object} worksheet - Worksheet instance.
	 * @param {number} column - Index of the column being sorted.
	 * @param {number} direction - Sorting direction (1 for ascending, -1 for descending).
	 * @param {number[]} newOrderValues - Sorted order of values.
	 * @returns {false | number[] | undefined} - False to cancel sorting, undefined to allow default sorting.
	 */
	onbeforesort(worksheet, column, direction, newOrderValues) {
		// Prevent sorting for the row selection checkbox column
		return +column === this.jss_det.columnsIdx._rowCheckbox ? false : undefined;
	}
	//#endregion JSpreadsheet events

	//#region Manage JSpreadsheet Data related functions.
	/**
	 * Prepares and assigns the data to the JSpreadsheet instance.
	 * It separates valid fields from additional fields into an `otherDet` object.
	 */
	prepare_jss_data(data = []) {
		// Map the input data, separating known fields from additional fields.
		return data.map((row) => {
			const formattedRow = { _otherDet: {}, _rowCheckbox: false }; // Object to store valid fields and other details.

			// Iterate through each key in the row and categorize it.
			for (const key in row) {
				(this.jss_det.validListFields.has(key) ? formattedRow : formattedRow._otherDet)[
					key
				] = row[key];
			}

			return formattedRow;
		});
	}

	/**
	 * Retrieves the current data from JSpreadsheet.
	 * @returns {Array} The current JSpreadsheet data.
	 */
	get_jss_data() {
		return this.jss_instance[0].getData();
	}

	/**
	 * Retrieves the data for a specific row in the JSpreadsheet instance.
	 *
	 * @param {number} rowIdx - The index of the row to fetch data from.
	 * @returns {Array} The data of the specified row.
	 */
	get_jss_row_data(rowIdx) {
		return this.jss_instance[0].getRowData(rowIdx);
	}

	/**
	 * Sets data for a specific row in JSpreadsheet.
	 * @param {number} row - Row index.
	 * @param {Array} data - Data to set in the row.
	 * @param {boolean} force - If true, force overrides existing data, including readonly cells.
	 */
	set_jss_row_data(row, data, force) {
		return this.jss_instance[0].setRowData(row, data, force);
	}

	/**
	 * Gets the cell value at (x, y), either processed or raw.
	 *
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 * @param {boolean} [processed] - Return processed value if true.
	 * @param {boolean} [raw] - Return unformatted value if true.
	 * @returns {*} Cell value.
	 */
	get_value_from_coords(x, y, processed, raw) {
		return this.jss_instance[0].getValueFromCoords(x, y, processed, raw);
	}

	/**
	 * Updates the JSpreadsheet instance with new data.
	 */
	update_jss_data(updatedData, adjustDimension) {
		this.jss_instance[0].loadData(updatedData, adjustDimension);
	}

	/**
	 * Set a cell value
	 *
	 * @param colIdx
	 * @param rowIdx
	 * @param value value
	 * @param force value over readonly cells
	 */
	set_value_from_coords(colIdx, rowIdx, value, force) {
		this.jss_instance[0].setValueFromCoords(colIdx, rowIdx, value, force);
	}

	//#endregion Manage JSpreadsheet Data related functions.

	//#region JSpreadsheet Header related functions.

	/**
	 * Generates the field header based on field type and column settings.
	 */
	generate_field_header_by_field_type(col) {
		// Set default header properties common to all field types
		const defaultHeader = {
			name: col.df.fieldname,
			title: col.df.label,
			type: "text", // Default type as text, can be overridden
			width: +col.df.width || 230, // Default width
			wrap: true, // Enable wrapping by default
		};

		// Adjust properties based on field type
		switch (col.df.fieldtype) {
			case "Long Text":
				defaultHeader.width = +col.df.width || 350;
				defaultHeader.render = this.cm_render_long_text_element.bind(this);
				break;

			case "Int":
			case "Float":
				defaultHeader.type = "number"; // Use number type for Int and Float
				defaultHeader.width = +col.df.width || 100;
				// Pending:: Apply mask based on database
				break;

			case "Currency":
				// Customize for Currency (could be a formatted number)
				// defaultHeader.type = "number";
				// defaultHeader.width = +col.df.width || 100;
				break;

			case "Date":
				// Handle Date, Time, and Datetime types here
				// IN :: In the future, we need to set the format according to the DB format.
				defaultHeader.type = "calendar";
				defaultHeader.options = { format: "DD/MM/YYYY" };
				break;

			case "Time":
				defaultHeader.type = "calendar";
				break;

			case "Datetime":
				defaultHeader.type = "calendar";
				break;

			case "Percent":
				// For Percent, we might want to handle it differently, like appending "%" symbol
				// defaultHeader.type = "number";
				// defaultHeader.options = { style: "percent" };
				// Apply additional logic for formatting as a percentage
				break;

			case "Data":
				// No change to the defaultHeader data for "Data" type
				break;

			case undefined:
				if (col.type === "Subject") {
					defaultHeader.render = this.cm_render_link_element.bind(this);
					defaultHeader.readOnly = true;
				}
				break;

			default:
				// No changes for unsupported types
				break;
		}

		// Return the final header configuration
		return defaultHeader;
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
			{ name: "_rowCheckbox", type: "checkbox", width: 38 },
		];

		// Transform columns into JSpreadsheet format
		const visibleColumns = this.columns
			.filter((col) => col.type === "Field" || col.type === "Subject") // Process only 'Field' type columns
			.map((col) => {
				this.jss_det.validListFields.add(col.df.fieldname);
				return this.generate_field_header_by_field_type(col);
			});

		// Combine hidden and visible columns
		this.jss_det.columns = [...hiddenColumns, ...visibleColumns];
		this.store_header_idx();
	}

	/**
	 * Stores the index of each column in the `columnsIdx` object for quick lookup.
	 * This improves performance when accessing column positions by name.
	 */
	store_header_idx() {
		const columns = this.jss_det.columns;
		const columnsIdx = Object.create(null);

		for (let i = 0, len = columns.length; i < len; i++) {
			columnsIdx[columns[i].name] = i;
		}

		this.jss_det.columnsIdx = columnsIdx;
	}
	//#endregion JSpreadsheet Header related functions.

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
			checked_row_det: [], // Stores details of checked rows
			isSpreadsheetInitialized: undefined, // Store boolean value for the spreadsheet is initialized or not.
		};
	}

	/**
	 * Initializes the JSpreadsheet instance.
	 * This function sequentially executes required setup steps using `frappe.run_serially()`.
	 */
	init_spreadsheet() {
		// NOTE: We can add here more function which is related to jspreadsheet intialized./ NOTE: Additional functions related to JSpreadsheet initialization can be added here.
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
			contextMenu: function () {
				return false;
			},
			onchange: (...args) => this.onchange(...args),
			oncreatecolumn: (...args) => this.oncreatecolumn(...args),
			onbeforesort: (...args) => this.onbeforesort(...args),
			onafterchanges: (...args) => this.onafterchanges(...args),
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
					allowManualInsertRow: false,
					allowManualInsertColumn: false,
				},
			],
		});
		this.jss_det.isSpreadsheetInitialized = true;

		this.add_custom_log("3: Spreadsheet initialized!");
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
		this.handle_row_selection_after_data_update();

		// Restore previous scroll position
		jss.goto(currentVisibleRow, currentVisibleCol);
	}
	//#endregion Init JSpreadsheet related functions.

	//#region Cleanup functions
	// Cleanup function code is on hold due to technical issues.
	cleanup() {
		console.log("CM: Cleaning up event listeners...");
		window.removeEventListener("resize", this.onResize);
		frappe.router.off("change", this.routeChangeHandler);
	}
	//#endregion Cleanup functions
};

class JssElementFactory {
	constructor() {
		// Precompiled template for long text field
		this.templates = {
			longTextWrapper: this.create_long_text_element(), // Precompiled long text template
			linkWrapper: this.create_link_element(), // Precompiled link template
		};
	}

	//#region Long text field element
	/**
	 * Creates and precompiles the long text element (wrapper, span, and view icon)
	 */
	create_long_text_element() {
		const wrapper = document.createElement("div");
		wrapper.className = "long-text-field-wrapper";

		const span = document.createElement("span");
		span.className = "long-text-field-span";

		const viewButton = document.createElement("span");
		viewButton.className = "jss-grid-view-icon cm-clickable-content";
		viewButton.innerHTML = `<i class="fa fa-eye"></i>`; // Font Awesome Eye Icon
		viewButton.dataset.keyIdx = 1; // Managed so that based on this key, the appropriate function will be called.

		// Append the elements to form the structure
		wrapper.appendChild(span);
		wrapper.appendChild(viewButton);

		return wrapper;
	}

	/**
	 * Renders a long text field in the table cell.
	 * @param {HTMLElement} td - Target cell.
	 * @param {string|number} value - Display value.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 */
	cm_render_long_text_element(td, value) {
		if (!td) return;

		// Clone precompiled wrapper (deep clone to ensure unique instance for each use)
		const wrapper = this.templates.longTextWrapper.cloneNode(true); // Clone the wrapper element, not the template function
		// Set the content of the span to the provided value
		wrapper.firstChild.textContent = value;

		// Efficiently replace existing content with the new wrapper
		td.replaceChildren(wrapper);
	}

	//#endregion Long text field element

	//#region Link field element
	/**
	 * Creates and precompiles the link element (wrapper and anchor tag)
	 */
	create_link_element() {
		const wrapper = document.createElement("span");
		wrapper.className = "link-field-span cm-clickable-content";
		wrapper.dataset.keyIdx = 2; // Managed so that based on this key, the appropriate function will be called.

		return wrapper;
	}

	/**
	 * Renders a link element in the table cell.
	 */
	cm_render_link_element(td, value) {
		if (!td) return;

		// Clone precompiled wrapper
		const wrapper = this.templates.linkWrapper.cloneNode(true);
		wrapper.textContent = value;
		td.replaceChildren(wrapper);
	}
	//#endregion Link field element
}
