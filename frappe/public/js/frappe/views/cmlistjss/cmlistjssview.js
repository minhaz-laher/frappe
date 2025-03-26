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
   */
  async loadAssets() {
    try {
      // Load JavaScript files required for JSpreadsheet.
      const jsFiles = await this.loadFilesFromDirectory(
        "/assets/frappe/js/jss/",
        "js"
      );
      await Promise.all(jsFiles.map((file) => this.loadJs(file)));

      // Load CSS files required for styling JSpreadsheet.
      const cssFiles = await this.loadFilesFromDirectory(
        "/assets/frappe/css/jss/",
        "css"
      );
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
        js: [
          "jspreadsheet.js",
          "jsuites.js",
          "render.js",
          "parser.js",
          "formula-pro.js",
        ],
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
      "MDY0ODUzNmViOGRiNTE3MGRmMjFmMjk2MDUwZWMxZmQ3Yzk5YzMwZDUwMGE2M2NlYzQ4YzhmMjBmMDdmZDQ1MmE5NWM1NjZmYjA1MGQwOGIwNTZmYTUzNzQ5YjdhYjMzMmU4ZDY1MjM0OGY5ZGIyYzBmOTkwMzViMTg3NDQ2OTUsZXlKamJHbGxiblJKWkNJNklpSXNJbTVoYldVaU9pSktjM0J5WldGa2MyaGxaWFFpTENKa1lYUmxJam94TnpRek1EVTFPRFl3TENKa2IyMWhhVzRpT2xzaWFuTndjbVZoWkhOb1pXVjBMbU52YlNJc0ltTnZaR1Z6WVc1a1ltOTRMbWx2SWl3aWFuTm9aV3hzTG01bGRDSXNJbU56WWk1aGNIQWlMQ0ozWldJaUxDSnNiMk5oYkdodmMzUWlYU3dpY0d4aGJpSTZJak0wSWl3aWMyTnZjR1VpT2xzaWRqY2lMQ0oyT0NJc0luWTVJaXdpZGpFd0lpd2lkakV4SWl3aVkyaGhjblJ6SWl3aVptOXliWE1pTENKbWIzSnRkV3hoSWl3aWNHRnljMlZ5SWl3aWNtVnVaR1Z5SWl3aVkyOXRiV1Z1ZEhNaUxDSnBiWEJ2Y25SbGNpSXNJbUpoY2lJc0luWmhiR2xrWVhScGIyNXpJaXdpYzJWaGNtTm9JaXdpY0hKcGJuUWlMQ0p6YUdWbGRITWlMQ0pqYkdsbGJuUWlMQ0p6WlhKMlpYSWlMQ0p6YUdGd1pYTWlYU3dpWkdWdGJ5STZkSEoxWlgwPQ=="
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
    this.jss_det = this.jss_det || {}; // Initialize jss_det to store JSpreadsheet-related data.
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
   */
  setup_columns() {
    super.setup_columns();
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
  //#endregion Override parent methods to achieve desired functionality in the JSpreadsheet view.

  //#region Init JSpreadsheet related functions.
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
    this.$jss_parent_container = $(
      '<div class="cm-jss-parent-container"></div>'
    )
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
    jspreadsheet(this.$jss_container.get(0), {
      autoCasting: false,
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
  //#endregionInit JSpreadsheet related functions.

  //#region JSpreadsheet Header related functions.
  /**
   * Prepares the column definitions for JSpreadsheet based on the data type of the Doctype.
   */
  prepare_source_header() {
    // Ensure columns are available before proceeding
    if (!this.columns) return;

    // Define hidden columns for internal use
    const hiddenColumns = [{ name: "otherDet", type: "hidden" }];

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
  }

  //#endregion JSpreadsheet Header related functions.

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
      const formattedRow = { otherDet: {} }; // Object to store valid fields and other details.

      // Iterate through each key in the row and categorize it.
      for (const key in row) {
        (validFields.has(key) ? formattedRow : formattedRow.otherDet)[key] =
          row[key];
      }

      return formattedRow;
    });
  }

  //#endregion Manage JSpreadsheet Data related functions.

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
      jspreadsheet.current?.element?.offsetWidth !== this.jss_det.tableWidth ||
      jspreadsheet.current?.element?.offsetHeight !== this.jss_det.tableHeight
    ) {
      // Apply new viewport dimensions if they have changed
      jspreadsheet.current?.setViewport(
        this.jss_det.tableWidth,
        this.jss_det.tableHeight
      );
    }
  }

  /**
   * Creates a debounced version of a function to limit execution rate.
   * Ensures the function is executed only after a delay, preventing excessive calls.
   *
   * @param {Function} func - The function to debounce.
   * @param {number} delay - The delay in milliseconds before executing the function.
   * @returns {Function} - A debounced function.
   */
  debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout); // Clear the previous timeout
      timeout = setTimeout(() => func.apply(this, args), delay); // Set a new timeout
    };
  }

  /**
   * Handles window resize events with debouncing to prevent frequent calls.
   * Updates the JSpreadsheet viewport only after 300ms delay.
   */
  onResize = this.debounce(() => {
    this.set_jss_viewport();
  }, 300);
  //#endregion Manage spreadsheet height

  //#region Cleanup functions
  // Cleanup function code is on hold due to technical issues.
  cleanup() {
    console.log("Cleaning up event listeners...");
    window.removeEventListener("resize", this.onResize);
    frappe.router.off("change", this.routeChangeHandler);
  }
  //#endregionCleanup functions
};
