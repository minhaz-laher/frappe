export class JssElementFactory {
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
    viewButton.dataset.keyname = "long_text"; // Managed so that based on this key, the appropriate function will be called.

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
    wrapper.dataset.keyname = "name_link"; // Managed so that based on this key, the appropriate function will be called.

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
