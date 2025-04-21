const controlClassMap = {
	"CM Component": () => import("./cm_component_form"), 
};

frappe.views.make_control_form = async function (opts) {
	const doctype = opts.doctype;
	if (!doctype) {
		console.log("Doctype not provided for control form");
		return;
	}

	const loader = controlClassMap[doctype];
	if (!loader) {
		console.log("No control form registered for doctype:", doctype);
		return;
	}

	try {
		const module = await loader();
		const ControlClass = module.default; // assuming `export default` used
		return new ControlClass(opts);
	} catch (e) {
		console.error("Failed to load control form for", doctype, e);
	}
};
