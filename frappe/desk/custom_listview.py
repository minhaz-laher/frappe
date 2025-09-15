import frappe
import json

@frappe.whitelist()
def update_records():
	# Need to check related to field validations.
	# Improve API for if record is deleted, then show error on UI side.
    try:
        # Parse incoming data
        data = frappe.local.form_dict
        doctype = data.get("doctype")
        records = data.get("records", "[]")  # Default to an empty string to avoid NoneType error

        # Ensure `records` is properly parsed as a list
        if isinstance(records, str):
            try:
                records = json.loads(records)
            except json.JSONDecodeError:
                return {"status": "error", "message": "Invalid JSON format for records."}

        # Validate input
        if not doctype or not isinstance(records, list) or not records:
            return {"status": "error", "message": "Invalid input: doctype and records must be provided."}

        # Check if user has permission to update this doctype
        if not frappe.permissions.has_permission(doctype, "write"):
            return {"status": "error", "message": f"You do not have permission to update {doctype}."}

        updated_records = []
        errors = []

        # Fetch all document names in one query to reduce DB calls
        record_ids = [record.get("name") for record in records if record.get("name")]
        existing_records = {doc.name for doc in frappe.get_all(doctype, filters={"name": ["in", record_ids]}, fields=["name"])}

        # Fetch permitted fields for the doctype
        valid_fields = {field.fieldname for field in frappe.get_meta(doctype).fields}

        # Prepare bulk update data
        updates = []
        for record in records:
            record_id = record.get("name")
            updated_fields = record.get("updatedField", [])

            if not record_id or not isinstance(updated_fields, list) or not updated_fields:
                errors.append({"record": record_id, "error": "Invalid record structure."})
                continue  # Skip invalid records

            if record_id not in existing_records:
                errors.append({"record": record_id, "error": "Record not found."})
                continue  # Skip non-existent records

            # Collect update values in bulk, ensuring fields are allowed
            for field_dict in updated_fields:
                for field, value in field_dict.items():
                    if field in valid_fields:
                        updates.append({"doctype": doctype, "name": record_id, "fieldname": field, "value": value})
                    else:
                        errors.append({"record": record_id, "field": field, "error": "Field update not allowed."})

        # Apply bulk updates using `frappe.db.set_value`
        for update in updates:
            frappe.db.set_value(update["doctype"], update["name"], update["fieldname"], update["value"], update_modified=True)

        # Commit all updates in one transaction for better performance
        if updates:
            frappe.db.commit()
            updated_records = list({update["name"] for update in updates})  # Get unique updated records

        return {
            "status": "success" if updated_records else "error",
            "updated_records": updated_records,
            "errors": errors if errors else None
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "API Error: update_records")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_dummy_autocomplete(txt=None, **kwargs):
    if not txt:
        return []

    # Simulated search result suggestions
    dummy_suggestions = [
        {"label": f"{txt} beans", "value": f"{txt} beans"},
        {"label": f"{txt} shop near me", "value": f"{txt} shop near me"},
        {"label": f"{txt} price", "value": f"{txt} price"},
        {"label": f"{txt} vs tea", "value": f"{txt} vs tea"},
    ]

    return dummy_suggestions