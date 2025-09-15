export default class CMTestNewForm {
	constructor(opts) {
		Object.assign(this, opts);
		this.cm_control_frm = this.cscript.frm;
	}

	/**
	 * We can customize the form rendering. For example, in an HTML field, we can load any custom HTML content.
	 */
	render_form() {
		this.cm_control_frm.fields_dict.cm_html_t4s1f1.wrapper.fieldobj.set_value(
			"welcome to <b>frappe</b>"
		);
	}
}
