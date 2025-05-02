// Component List Class
export default class CMComponentList {
	constructor(opts) {
		if (!opts || !opts.parent) {
			throw new Error('CMComponentList requires parent option');
		}
		
		Object.assign(this, opts);
		this.pr_list_view = this.parent.list_view;
		this._cm_component_element_factory = new CMComponentElementFactory();
		this._searchCache = new Map(); // Cache for Google search URLs
	}

	//#region List View Action Menu
	/**
	 * Adds custom actions to the list view's actions menu.
	 * @param {Array} actions_menu_items - Existing list of actions menu items to be extended.
	 * @returns {void}
	 */
	get_actions_menu_items(actions_menu_items) {
		if (!Array.isArray(actions_menu_items)) {
			console.warn('actions_menu_items is not an array');
			return;
		}

		const goToBOM = () => ({
			label: __("Go to BOM", null, "Button in list view actions menu"),
			action: () => this.handleBOMNavigation(),
			standard: true,
		});

		actions_menu_items.push(goToBOM());
	}

	/**
	 * Handles navigation to BOM page with validation
	 * @private
	 */
	handleBOMNavigation() {
		try {
			const selectedDocs = this.pr_list_view.get_checked_items();
			
			if (!selectedDocs || selectedDocs.length !== 1) {
				this.showNotification(
					`You've selected <b>${selectedDocs?.length || 0}</b> records. Please select only <b>1</b> record to navigate to the BOM page.`
				);
				return;
			}

			const selectedDoc = selectedDocs[0];
			if (selectedDoc?.category === 3) {
				frappe.set_route("cm-rfq-lineitems", "cmpage", "bom", selectedDoc.name);
			} else {
				this.showNotification("Please select an assembly part only.");
			}
		} catch (error) {
			console.error('Error in BOM navigation:', error);
			this.showNotification("An error occurred while navigating to BOM page.");
		}
	}

	/**
	 * Shows a notification message
	 * @private
	 * @param {string} message - The message to display
	 */
	showNotification(message) {
		frappe.msgprint({
			title: "Notification",
			message,
			indicator: "blue",
		});
	}
	//#endregion List View Action Menu

	//#region Customize cell render related functions.
	/**
	 * Registers click handler functions for specific cell fields.
	 * @param {object} cmIdxFnMappingDet - Field-handler mapping object.
	 */
	prepare_cm_idx_fn_mapping_det(cmIdxFnMappingDet) {
		if (!cmIdxFnMappingDet || typeof cmIdxFnMappingDet !== 'object') {
			console.warn('Invalid cmIdxFnMappingDet provided');
			return;
		}

		cmIdxFnMappingDet.mpn_code_field = {
			handlerFn: this.handle_mpn_field_click.bind(this),
		};
	}

	/**
	 * Attaches a custom cell renderer for the 'mfg_pn' field.
	 * @param {object} defaultHeader - The default field header definition.
	 */
	generate_field_header_by_field_type(defaultHeader) {
		if (!defaultHeader || typeof defaultHeader !== 'object') {
			console.warn('Invalid defaultHeader provided');
			return;
		}

		if (defaultHeader.name === "mfg_pn") {
			defaultHeader.render = this.cm_render_mpn_field_element.bind(this);
		}
	}

	/**
	 * Renders a cell using the MPN field element.
	 * @param {HTMLElement} td - Target cell element.
	 * @param {*} value - Value to display.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 * @param {object} instance - Worksheet instance.
	 * @param {object} options - Column configuration options.
	 */
	cm_render_mpn_field_element(td, value, x, y, instance, options) {
		if (!td || !(td instanceof HTMLElement)) {
			console.warn('Invalid td element provided');
			return;
		}

		try {
			this._cm_component_element_factory.cm_render_mpn_field_element(td, value, x, y);
		} catch (error) {
			console.error('Error rendering MPN field:', error);
			td.textContent = value || ''; // Fallback to simple text display
		}
	}
	//#endregion Customize cell render related functions.

	//#region Handle Events
	/**
	 * Opens a Google search for a given value in a new tab.
	 * @param {string} value - The value to search.
	 */
	searchOnGoogle(value) {
		if (!value) return;

		try {
			// Check cache first
			if (this._searchCache.has(value)) {
				window.open(this._searchCache.get(value), "_blank");
				return;
			}

			const query = encodeURIComponent(value);
			const googleSearchURL = `https://www.google.com/search?q=${query}`;
			
			// Cache the URL
			this._searchCache.set(value, googleSearchURL);
			
			window.open(googleSearchURL, "_blank");
		} catch (error) {
			console.error('Error in Google search:', error);
		}
	}

	/**
	 * Handles click events on the MPN field and initiates a Google search.
	 * @param {Event} e - Click event.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 */
	handle_mpn_field_click(e, x, y) {
		try {
			const value = this.pr_list_view.get_value_from_coords(x, y);
			if (value) {
				this.searchOnGoogle(value);
			}
		} catch (error) {
			console.error('Error handling MPN field click:', error);
		}
	}
	//#endregion Handle Events
}

// Factory class to generate and render custom field elements related to Component list page
class CMComponentElementFactory {
	constructor() {
		this.componentFieldTemplates = new Map();
		this.initializeTemplates();
	}

	/**
	 * Initializes all field templates
	 * @private
	 */
	initializeTemplates() {
		this.componentFieldTemplates.set('mpnFieldWrapper', this.create_mpn_element());
	}

	/**
	 * Creates and precompiles the mpn Field element
	 * @returns {HTMLElement} The precompiled MPN field wrapper
	 * @private
	 */
	create_mpn_element() {
		const wrapper = document.createElement("div");
		wrapper.className = "common-text-field-wrapper";

		const span = document.createElement("span");
		span.className = "mpn-field-value";

		const cmButton = document.createElement("span");
		cmButton.className = "jss-grid-common-icon cm-clickable-content";
		cmButton.innerHTML = `<i class="fa fa-google" aria-hidden="true"></i>`;
		cmButton.dataset.keyname = "mpn_code_field";
		cmButton.setAttribute('role', 'button');
		cmButton.setAttribute('aria-label', 'Search on Google');

		wrapper.appendChild(span);
		wrapper.appendChild(cmButton);

		return wrapper;
	}

	/**
	 * Renders a mpn Field field in the table cell.
	 * @param {HTMLElement} td - Target cell.
	 * @param {string|number} value - Display value.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 */
	cm_render_mpn_field_element(td, value) {
		if (!td || !(td instanceof HTMLElement)) {
			console.warn('Invalid td element provided');
			return;
		}

		try {
			const wrapper = this.componentFieldTemplates.get('mpnFieldWrapper').cloneNode(true);
			const valueSpan = wrapper.querySelector('.mpn-field-value');
			
			if (valueSpan) {
				valueSpan.textContent = value || '';
			}

			td.replaceChildren(wrapper);
		} catch (error) {
			console.error('Error rendering MPN field element:', error);
			td.textContent = value || ''; // Fallback to simple text display
		}
	}
}
