// Component List Class
export default class CMComponentList {
	constructor(opts) {
		Object.assign(this, opts);
		this.pr_list_view = this.parent.list_view;
		this._cm_component_element_factory = new CMComponentElementFactory();
	}

	//#region List View Action Menu
	/**
	 * Adds custom actions to the list view's actions menu.
	 * @param {Array} actions_menu_items - Existing list of actions menu items to be extended.
	 */
	get_actions_menu_items(actions_menu_items) {
		const goToBOM = () => ({
			label: __("Go to BOM", null, "Button in list view actions menu"),
			action: () => {
				const selectedDocs = this.pr_list_view.get_checked_items();

				if (selectedDocs.length !== 1) {
					frappe.msgprint({
						title: "Notification",
						message: `You've selected <b>${selectedDocs.length}</b> records. Please select only <b>1</b> record to navigate to the BOM page.`,
						indicator: "blue",
					});
					return;
				}

				const selectedDoc = selectedDocs[0];
				if (selectedDoc?.category === 3) {
					frappe.set_route("cm-rfq-lineitems", "cmpage", "bom", selectedDoc?.name);
				} else {
					frappe.msgprint({
						title: "Notification",
						message: "Please select an assembly part only.",
						indicator: "blue",
					});
				}
			},
			standard: true,
		});

		actions_menu_items.push(goToBOM());
	}
	//#endregion List View Action Menu

	//#region Customize cell render related functions.
	/**
	 * Registers click handler functions for specific cell fields.
	 *
	 * @param {object} cmIdxFnMappingDet - Field-handler mapping object.
	 */
	prepare_cm_idx_fn_mapping_det(cmIdxFnMappingDet) {
		cmIdxFnMappingDet.mpn_code_field = {
			handlerFn: this.handle_mpn_field_click.bind(this),
		};
	}

	/**
	 * Attaches a custom cell renderer for the 'mfg_pn' field.
	 *
	 * @param {*} defaultHeader - The default field header definition.
	 */
	generate_field_header_by_field_type(defaultHeader) {
		if (defaultHeader.name === "mfg_pn") {
			defaultHeader.render = this.cm_render_mpn_field_element.bind(this);
		}
	}

	/**
	 * Renders a cell using the MPN field element.
	 *
	 * @param {HTMLElement} td - Target cell element.
	 * @param {*} value - Value to display.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 * @param {object} instance - Worksheet instance.
	 * @param {object} options - Column configuration options.
	 */
	cm_render_mpn_field_element(td, value, x, y, instance, options) {
		this._cm_component_element_factory.cm_render_mpn_field_element(td, value, x, y);
	}
	//#endregion Customize cell render related functions.

	//#region Handle Events
	/**
	 * Opens a Google search for a given value in a new tab.
	 *
	 * @param {string} value - The value to search.
	 */
	searchOnGoogle(value) {
		if (!value) return;

		const query = encodeURIComponent(value);
		const googleSearchURL = `https://www.google.com/search?q=${query}`;

		window.open(googleSearchURL, "_blank");
	}
	/**
	 * Handles click events on the MPN field and initiates a Google search.
	 *
	 * @param {Event} e - Click event.
	 * @param {number} x - Row index.
	 * @param {number} y - Column index.
	 */
	handle_mpn_field_click(e, x, y) {
		const value = this.pr_list_view.get_value_from_coords(x, y);
		this.searchOnGoogle(value);
	}
	//#endregion Handle Events
}

// Factory class to generate and render custom field elements related to Component list page
class CMComponentElementFactory {
	constructor() {
		this.componentFieldTemplates = {
			mpnFieldWrapper: this.create_mpn_element(), // Precompiled mpn field template
		};
	}

	//#region mpn Field field element
	/**
	 * Creates and precompiles the mpn Field element
	 */
	create_mpn_element() {
		const wrapper = document.createElement("div");
		wrapper.className = "common-text-field-wrapper";

		const span = document.createElement("span");
		//   span.className = "long-text-field-span";

		const cmButton = document.createElement("span");
		cmButton.className = "jss-grid-common-icon cm-clickable-content";
		cmButton.innerHTML = `<i class="fa fa-google"></i>`; // Font Awesome Eye Icon
		cmButton.dataset.keyname = "mpn_code_field"; // Managed so that based on this key, the appropriate function will be called.

		// Append the elements to form the structure
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
		if (!td) return;

		// Clone precompiled wrapper (deep clone to ensure unique instance for each use)
		const wrapper = this.componentFieldTemplates.mpnFieldWrapper.cloneNode(true); // Clone the wrapper element, not the template function
		// Set the content of the span to the provided value
		wrapper.firstChild.textContent = value;

		// Efficiently replace existing content with the new wrapper
		td.replaceChildren(wrapper);
	}
	//#endregion mpn Field field element
}
