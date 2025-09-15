// Component Form Class
export default class CMComponentForm {
	constructor(opts) {
		Object.assign(this, opts);
		this.cm_control_frm = this.cscript.frm;
		this.cm_header_element = {};
	}

	/**
	 * Sets up the Custom header section.
	 */
	setup_cm_header_section() {
		const { mfg_pn, mfg_code } = this.cm_control_frm.doc;
		const section = this.cm_control_frm.page.cm_header_section;

		if (mfg_pn && mfg_code) {
			// Remove previous element if it exists to avoid duplicates
			if (this.cm_header_element.mfg_pn_ele?.parentNode) {
				this.cm_header_element.mfg_pn_ele.parentNode.removeChild(
					this.cm_header_element.mfg_pn_ele
				);
			}

			// Create a new div element with the formatted content
			const div = document.createElement("div");
			div.textContent = `${mfg_pn} | ${mfg_code}`;

			// Append the new div and keep a reference to it
			this.cm_header_element.mfg_pn_ele = (
				section instanceof HTMLElement ? section : section.get(0)
			).appendChild(div);
		} else if (this.cm_header_element.mfg_pn_ele?.parentNode) {
			// Clean up the previous element if data is missing
			this.cm_header_element.mfg_pn_ele.parentNode.removeChild(
				this.cm_header_element.mfg_pn_ele
			);
			this.cm_header_element.mfg_pn_ele = null;
		}
	}

	/**
	 * Refreshes the Custom header section by resetting its content.
	 */
	refresh_header() {
		this.setup_cm_header_section();
	}

	/**
	 * We can customize the form rendering. For example, in an HTML field, we can load any custom HTML content.
	 */
	render_form() {
		// console.log("Called render_form")
		// this.cm_control_frm.fields_dict.cm_bom_html.wrapper.fieldobj.set_value(
		// 	"welcome to <b>frappe</b>"
		// );
		// const bomTab = this.cm_control_frm.layout.tabs.find(t => t.label === "BOM");
		// if(bomTab){
		// 	bomTab.toggle(false);
		// }
	}

	/**
	 * Handles logic to be executed when a tab is activated.
	 *
	 * @param {Object} tab - The tab object containing tab details such as label and fields.
	 */
	set_active_tab(tab) {
		// Ensure the tab has a label and the label is "BOM"
		if (tab?.label === "BOM") {
			// Safely access the nested cm_bom_html field object
			const bomField = tab.fields_dict?.cm_bom_html?.wrapper?.fieldobj;

			bomField?.set_value?.("Welcome to <b>Frappe</b>");
		}
	}
}
