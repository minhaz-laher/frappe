export default class Column {
	constructor(section, df, nesting_level = 0) {
		if (!df) df = {};

		this.df = df;
		this.section = section;
		this.nesting_level = nesting_level;
		this.section.columns.push(this);
		this.nested_sections = []; // Track nested sections
		this.make();
		this.resize_all_columns();
	}

	make() {
		// Add nesting-level class for styling
		this.wrapper = $(`
			<div class="form-column nesting-level-${this.nesting_level}" data-fieldname="${this.df.fieldname}">
				<form>
				</form>
			</div>
		`).appendTo(this.section.body);

		this.form = this.wrapper.find("form").on("submit", () => false);

		if (this.df.description) {
			$(`
				<p class="col-sm-12 form-column-description">
					${__(this.df.description)}
				</p>
			`).prependTo(this.wrapper);
		}

		if (this.df.label) {
			$(`
				<label class="column-label">
					${__(this.df.label, null, this.df.parent)}
				</label>
			`).prependTo(this.wrapper);
		}
	}

	resize_all_columns() {
		// distribute all columns equally
		let columns = this.section.wrapper.find(".form-column").length;
		let colspan = cint(12 / columns);

		if (columns == 5) {
			colspan = 20;
		}

		// Apply different widths for nested columns
		if (this.nesting_level > 0) {
			// Nested columns should use the full width more aggressively
			this.section.wrapper.find(`.form-column.nesting-level-${this.nesting_level}`)
				.removeClass()
				.addClass(`form-column nesting-level-${this.nesting_level}`)
				.addClass("col-sm-" + colspan);
		} else {
		this.section.wrapper
			.find(".form-column")
			.removeClass()
			.addClass("form-column")
			.addClass("col-sm-" + colspan);
		}
	}

	// Method to add a nested section
	add_nested_section(section) {
		this.nested_sections.push(section);
	}

	add_field() {}

	refresh() {
		this.section.refresh();
		
		// Also refresh any nested sections
		if (this.nested_sections && this.nested_sections.length) {
			this.nested_sections.forEach(section => section.refresh());
		}
	}
}
