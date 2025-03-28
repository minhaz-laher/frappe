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

		// Bind the `this` context to onResize to ensure it refers to the instance.
		// Bind the `this` context to onResize and add the event listener.
		this.onResize = this.onResize.bind(this);
		window.addEventListener("resize", this.onResize);

		// Note: Commented out the above code due to issues in cleanup.
		// // Listen for page changes and execute cleanup.
		// this.routeChangeHandler = () => this.cleanup();
		// frappe.router.on("change", this.routeChangeHandler);
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
	load_jss_license() {
		// Set a temporary JSpreadsheet license key (valid for one day).
		// In future development, this key will be dynamically retrieved from an API.
		jspreadsheet.setLicense(
			"MWJlNDMwODIxYzk2ZTAxODE5YjdhYTUwNWI2NGVlOTI3ZDVmNDczYjQxNDBlMzg3NzkwY2Q4YTI0ODg2NWMzYzNmM2MzYmE3YzcyYTIxM2FjODFmMWE3Mjk5YzA1ZGVhMmFmNzBhZTFmMWI4OWMzMzcwNzM5ZjQ1NmYwYTY2OTYsZXlKamJHbGxiblJKWkNJNklpSXNJbTVoYldVaU9pSktjM0J5WldGa2MyaGxaWFFpTENKa1lYUmxJam94TnpRek1qSTJOall5TENKa2IyMWhhVzRpT2xzaWFuTndjbVZoWkhOb1pXVjBMbU52YlNJc0ltTnZaR1Z6WVc1a1ltOTRMbWx2SWl3aWFuTm9aV3hzTG01bGRDSXNJbU56WWk1aGNIQWlMQ0ozWldJaUxDSnNiMk5oYkdodmMzUWlYU3dpY0d4aGJpSTZJak0wSWl3aWMyTnZjR1VpT2xzaWRqY2lMQ0oyT0NJc0luWTVJaXdpZGpFd0lpd2lkakV4SWl3aVkyaGhjblJ6SWl3aVptOXliWE1pTENKbWIzSnRkV3hoSWl3aWNHRnljMlZ5SWl3aWNtVnVaR1Z5SWl3aVkyOXRiV1Z1ZEhNaUxDSnBiWEJ2Y25SbGNpSXNJbUpoY2lJc0luWmhiR2xrWVhScGIyNXpJaXdpYzJWaGNtTm9JaXdpY0hKcGJuUWlMQ0p6YUdWbGRITWlMQ0pqYkdsbGJuUWlMQ0p6WlhKMlpYSWlMQ0p6YUdGd1pYTWlYU3dpWkdWdGJ5STZkSEoxWlgwPQ=="
		);

		this.jss_license_loaded = true;
	}
	//#endregion Load JSpreadsheet assets and their license.

	//#region Override parent methods to achieve desired functionality in the JSpreadsheet view.
	/**
	 * Overrides the parent method
	 * @returns
	 */
	setup_defaults() {
		this.view = "Cmlistjss"; // We can change view name here.
		this.jss_det = this.initializeJSSDetails(); // Initialize JSpreadsheet-related data
		return super.setup_defaults().then((r) => {
			return r; // IN:: We can improve this syntax. The currently added syntax is just for testing purposes."
		});
	}

	/**
	 * Overrides the parent method
	 */
	setup_view() {
		this.setup_columns();
		this.settings.onload && this.settings.onload(this);
		this.show_restricted_list_indicator_if_applicable();
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
	 * Overrides the parent method to render the JSpreadsheet instance.
	 *
	 * - Removes any existing JSpreadsheet container to prevent duplication.
	 * - If JSpreadsheet is already loaded and licensed, it initializes immediately.
	 * - If not, it sets an interval to periodically check for JSpreadsheet's availability and initializes it once it is loaded.
	 */
	render() {
		// Remove the existing JSpreadsheet container if it exists to avoid duplication
		this.$jss_container?.remove();

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

		return this.data.filter((d) => docnames.includes(d.name));
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
	//#endregion Override parent methods to achieve desired functionality in the JSpreadsheet view.

	//#region Row checkboxes and the action menu functions.
	/**
	 * Handles the change event for a row checkbox, updating the checked row details accordingly.
	 * @param {number} rowIdx - Index of the row in the dataset.
	 * @param {boolean} newValue - Whether the checkbox is checked (true) or unchecked (false).
	 */
	handle_row_checkbox_change(rowIdx, newValue) {
		const recordName = this.jss_det.data[rowIdx]?.name;
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
			this.jss_det.$header_checkbox.checked =
				this.jss_det.data.length > 0 &&
				this.jss_det.data.length === this.jss_det.checked_row_det.length;
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
	}, 300);
	//#endregion Manage spreadsheet height

	//#region Common functions
	/**
	 * Retrieves the current data from JSpreadsheet.
	 * @returns {Array} The current JSpreadsheet data.
	 */
	get_jss_data() {
		return this.jss_det.data || [];
	}
	//#endregion Common functions

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
	//#endregionJSpreadsheet events

	//#region Manage JSpreadsheet Data related functions.
	/**
	 * Prepares and assigns the data to the JSpreadsheet instance.
	 * It separates valid fields from additional fields into an `otherDet` object.
	 */
	prepare_jss_data() {
		// Validate if data and columns exist before processing.
		if (!this.data?.length || !this.jss_det?.columns?.length) {
			console.error("Invalid or empty data/columns.");
			return;
		}

		// Create a Set of valid field names for quick lookup.
		const validFields = new Set(this.jss_det.columns.map(({ name }) => name));

		// Map the input data, separating known fields from additional fields.
		this.jss_det.data = this.data.map((row) => {
			const formattedRow = { _otherDet: {} }; // Object to store valid fields and other details.

			// Iterate through each key in the row and categorize it.
			for (const key in row) {
				(validFields.has(key) ? formattedRow : formattedRow._otherDet)[key] = row[key];
			}

			return formattedRow;
		});
	}

	//#endregion Manage JSpreadsheet Data related functions.

	//#region JSpreadsheet Header related functions.
	/**
	 * Prepares the column definitions for JSpreadsheet based on the data type of the Doctype.
	 */
	prepare_source_header() {
		// Ensure columns are available before proceeding
		if (!this.columns) return;

		// Define hidden columns for internal use
		const hiddenColumns = [
			{ name: "_otherDet", type: "hidden" },
			{ name: "_rowCheckbox", type: "checkbox", width: 80 },
		];

		// Transform columns into JSpreadsheet format
		const visibleColumns = this.columns
			.filter((col) => col.type === "Field" || col.type === "Subject") // Process only 'Field' type columns
			.map((col) => ({
				name: col.df.fieldname,
				title: col.df.label,
				type: "text", // Determine based on col.field type if needed
				width: 150,
				wrap: true,
			}));

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
	initializeJSSDetails() {
		return {
			columns: [], // Stores column configurations
			columnsIdx: {}, // Maps column names to their indexes (for internal use)
			data: [], // Holds JSpreadsheet data
			tableWidth: 800, // Default spreadsheet width
			tableHeight: 500, // Default spreadsheet height
			checked_row_det: [], // Stores details of checked rows
		};
	}

	/**
	 * Initializes the JSpreadsheet instance.
	 * This function sequentially executes required setup steps using `frappe.run_serially()`.
	 */
	init_spreadsheet() {
		this.init_container();

		frappe.run_serially([
			() => this.prepare_source_header(),
			() => this.prepare_jss_data(),
			() => this.render_spreadsheet(),
		]);
	}

	/**
	 * Creates a container element for JSpreadsheet and appends it to the result container.
	 */
	init_container() {
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
			worksheets: [
				{
					data: this.jss_det.data,
					columns: this.jss_det.columns,
					tableOverflow: true,
					resize: "both",
					minDimensions: [0, 0], // Minimum table size
					tableWidth: this.jss_det.tableWidth,
					tableHeight: this.jss_det.tableHeight,
				},
			],
		});

		console.log("Spreadsheet initialized!");
	}
	//#endregion Init JSpreadsheet related functions.

	//#region Cleanup functions
	// Cleanup function code is on hold due to technical issues.
	cleanup() {
		console.log("Cleaning up event listeners...");
		window.removeEventListener("resize", this.onResize);
		frappe.router.off("change", this.routeChangeHandler);
	}
	//#endregionCleanup functions
};
