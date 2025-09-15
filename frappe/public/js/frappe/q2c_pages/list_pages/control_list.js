const controlClassMap = {
	"CM Component": () => import("./cm_component_list"), 
};

frappe.views.make_control_list = async function (opts) {
	const doctype = opts.doctype;
	if (!doctype) {
		console.log("Doctype not provided for control list");
		return;
	}

	const loader = controlClassMap[doctype];
	if (!loader) {
		console.log("No control list registered for doctype:", doctype);
		return;
	}

	try {
		const module = await loader();
		const ControlClass = module.default; // assuming `export default` used
		return new ControlClass(opts);
	} catch (e) {
		console.error("Failed to load control list for", doctype, e);
	}
};
