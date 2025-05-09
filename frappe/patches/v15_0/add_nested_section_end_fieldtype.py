import frappe

def execute():
    """Add Nested Section End field type to the schema"""
    
    if "Nested Section End" not in frappe.db.sql_list("""
        SELECT options FROM `tabDocField` 
        WHERE parent='DocField' AND fieldname='fieldtype'
    """):
        # Get the fieldtype field from DocField meta
        docfield_meta = frappe.get_meta("DocField")
        fieldtype_field = docfield_meta.get_field("fieldtype")
        
        if fieldtype_field:
            # Get current options and add our new type
            options = fieldtype_field.options.split("\n")
            if "Nested Section End" not in options:
                options.append("Nested Section End")
                options.sort()  # Keep alphabetical order
                
                # Update options via DB
                frappe.db.sql("""
                    UPDATE `tabDocField` 
                    SET options = %s 
                    WHERE parent='DocField' AND fieldname='fieldtype'
                """, "\n".join(options))
                
                frappe.clear_cache(doctype="DocField")
                print("Added 'Nested Section End' fieldtype")
    
    # Add field support for is_nested in Section Break
    if not frappe.db.exists("DocField", {"parent": "DocField", "fieldname": "is_nested"}):
        # Add is_nested field to DocField
        frappe.get_doc({
            "doctype": "DocField",
            "fieldname": "is_nested",
            "label": "Is Nested Section",
            "fieldtype": "Check",
            "default": "0",
            "description": "If checked, this section will render inside its parent column",
            "insert_after": "collapsible_depends_on",
            "parent": "DocField",
            "parentfield": "fields",
            "parenttype": "DocType"
        }).insert()
        
        frappe.clear_cache(doctype="DocField")
        print("Added 'is_nested' field to DocField")
        
    # Add span_columns field to DocField
    if not frappe.db.exists("DocField", {"parent": "DocField", "fieldname": "span_columns"}):
        # Add span_columns field to DocField
        frappe.get_doc({
            "doctype": "DocField",
            "fieldname": "span_columns",
            "label": "Span Columns",
            "fieldtype": "Check",
            "default": "0",
            "description": "If checked, this nested section will span across all columns in its parent section",
            "insert_after": "is_nested",
            "parent": "DocField",
            "parentfield": "fields",
            "parenttype": "DocType"
        }).insert()
        
        frappe.clear_cache(doctype="DocField")
        print("Added 'span_columns' field to DocField") 