import frappe
from frappe import _
from typing import List, Dict, Any
import json

@frappe.whitelist()
def get_rfq_lineitems_with_alternates(part_ref: str) -> List[Dict[str, Any]]:
    """
    Return flattened RFQ Lineitems with alternate part details prefixed by 'al_'.
    If a lineitem has more than one alternate part, the first alternate will include a 'mergeRowCount' field indicating how many alternates there are.
    """
    if not part_ref:
        frappe.throw(_("Missing required parameter: part_ref"))

    # Fetch all RFQ Lineitems where part_ref matches
    lineitems = frappe.get_all(
        "CM RFQ Lineitems",
        filters={"part_ref": part_ref},
        fields=["*"]
    )

    if not lineitems:
        return []

    lineitem_names = [item["name"] for item in lineitems]

    # Fetch all alternate parts
    alternates = frappe.get_all(
        "CM RFQ Lineitems Alternate Part",
        filters={
            "parent": ["in", lineitem_names],
            "parenttype": "CM RFQ Lineitems"
        },
        fields=["*"]
    )

    # Group alternates by parent lineitem
    alternates_by_parent = {}
    for alt in alternates:
        parent = alt.get("parent")
        if not parent:
            continue
        alternates_by_parent.setdefault(parent, []).append(alt)

    # Prepare flattened result
    result = []

    for item in lineitems:
        base = item.copy()
        parent_name = item["name"]
        alternates = alternates_by_parent.get(parent_name, [])

        if not alternates:
            # No alternates → add row with null alternate fields
            result.append({**base, **get_empty_alternate_prefixed_fields()})
        else:
            # For each alternate, prefix alternate fields with 'al_' and flatten
            for index, alt in enumerate(alternates):
                flat_alt = {"al_" + key: value for key, value in alt.items()}
                
                # Add 'mergeRowCount' for the first alternate part if there are more than one alternate
                if index == 0 and len(alternates) > 1:
                    flat_alt["mergeRowCount"] = len(alternates)
                else:
                    flat_alt["mergeRowCount"] = None  # undefined if there are less than two alternates
                
                result.append({**base, **flat_alt})

    return result

def get_empty_alternate_prefixed_fields() -> Dict[str, Any]:
    """
    Returns a dictionary of alternate fields (prefixed with al_) initialized to None.
    """
    alt_fields = frappe.get_meta("CM RFQ Lineitems Alternate Part").fields
    return {"al_" + field.fieldname: None for field in alt_fields}

@frappe.whitelist()
def save_and_delete_rfq_data(payload):
    # Note: This method is just for testing purpose. In actual development we will update only dirty rows and also API save logic will be different.
    try:
        data = json.loads(payload)
        upsert_items = data.get("upsert", [])
        delete_items = data.get("delete", {})
        delete_lineitems = delete_items.get("lineitems", [])
        delete_alternates = delete_items.get("alternates", [])
    except Exception as e:
        frappe.throw(_("Invalid JSON payload: {0}").format(str(e)))

    # Handle inserts/updates
    for item in upsert_items:
        if item.get("name") and frappe.db.exists("CM RFQ Lineitems", item["name"]):
            doc = frappe.get_doc("CM RFQ Lineitems", item["name"])
            doc.update(item)
        else:
            doc = frappe.new_doc("CM RFQ Lineitems")
            doc.update(item)

        # Clear old alternates if updating
        doc.set("alternate_parts", [])

        for alt in item.get("alternate_parts", []):
            if alt.get("name") and frappe.db.exists("CM RFQ Lineitems Alternate Part", alt["name"]):
                alt_doc = frappe.get_doc("CM RFQ Lineitems Alternate Part", alt["name"])
                alt_doc.update(alt)
            else:
                alt_doc = frappe.new_doc("CM RFQ Lineitems Alternate Part")
                alt_doc.update(alt)

            alt_doc.parent = doc.name
            alt_doc.parenttype = "CM RFQ Lineitems"
            alt_doc.parentfield = "alternate_parts"
            doc.append("alternate_parts", alt_doc)

        doc.save()

    # Handle deletes
    for name in delete_alternates:
        if frappe.db.exists("CM RFQ Lineitems Alternate Part", name):
            frappe.delete_doc("CM RFQ Lineitems Alternate Part", name, force=1)

    for name in delete_lineitems:
        if frappe.db.exists("CM RFQ Lineitems", name):
            frappe.delete_doc("CM RFQ Lineitems", name, force=1)

    frappe.db.commit()
    return {"status": "success", "message": "Saved and deleted successfully"}

@frappe.whitelist()
def get_list_settings():
    """
    Returns the list view settings for RFQ Line Items and their Alternates.
    
    In the future, this data will be fetched dynamically from the database or configuration DocTypes.
    """
    return [
        { "fieldname": "name", "label": "ID", "isMergeCol": True },
        { "fieldname": "line_id", "label": "Line ID", "isMergeCol": True },
        { "fieldname": "qpa", "label": "QPA", "isMergeCol": True },
        { "fieldname": "ref_designator", "label": "Ref Designator", "isMergeCol": True },
        { "fieldname": "cust_pn", "label": "Cust PN", "isMergeCol": True },
        { "fieldname": "cust_pn_ref", "label": "Cust PN Ref", "isMergeCol": True },
        { "fieldname": "description", "label": "Description", "isMergeCol": True },
        { "fieldname": "is_install", "label": "Is Install", "isMergeCol": True },
        { "fieldname": "is_purchase", "label": "Is Purchase", "isMergeCol": True },
        { "fieldname": "is_deleted", "label": "Is Deleted", "isMergeCol": True },
        { "fieldname": "cust_rev", "label": "Cust Rev", "isMergeCol": True },
        { "fieldname": "cust_description", "label": "Cust Description", "isMergeCol": True },
        { "fieldname": "dnp_qty", "label": "DNP Qty", "isMergeCol": True },
        { "fieldname": "dnp_desig", "label": "DNP Desig", "isMergeCol": True },
        { "fieldname": "part_ref", "label": "Part Ref", "isMergeCol": True },
        { "fieldname": "cust_line_id", "label": "Cust Line ID", "isMergeCol": True },
        { "fieldname": "table_akgg", "label": "", "isMergeCol": True },
        { "fieldname": "al_name", "label": "al_name", "isMergeCol": False },
        { "fieldname": "al_creation", "label": "al_creation", "isMergeCol": False },
        { "fieldname": "al_modified", "label": "al_modified", "isMergeCol": False },
        { "fieldname": "al_modified_by", "label": "al_modified_by", "isMergeCol": False },
        { "fieldname": "al_owner", "label": "al_owner", "isMergeCol": False },
        { "fieldname": "al_docstatus", "label": "al_docstatus", "isMergeCol": False },
        { "fieldname": "al_idx", "label": "al_idx", "isMergeCol": False },
        { "fieldname": "al_parent", "label": "al_parent", "isMergeCol": False },
        { "fieldname": "al_parentfield", "label": "al_parentfield", "isMergeCol": False },
        { "fieldname": "al_parenttype", "label": "al_parenttype", "isMergeCol": False },
        { "fieldname": "al_rfq_lineitem_ref", "label": "al_rfq_lineitem_ref", "isMergeCol": False },
        { "fieldname": "al_mfg_code", "label": "al_mfg_code", "isMergeCol": False },
        { "fieldname": "al_mfg_pn", "label": "al_mfg_pn", "isMergeCol": False },
        { "fieldname": "al_mfg_code_id", "label": "al_mfg_code_id", "isMergeCol": False },
        { "fieldname": "al_mfg_pn_ref", "label": "al_mfg_pn_ref", "isMergeCol": False },
        { "fieldname": "al_part_type_id", "label": "al_part_type_id", "isMergeCol": False },
        { "fieldname": "al_part_ref", "label": "al_part_ref", "isMergeCol": False },
        { "fieldname": "al_description", "label": "al_description", "isMergeCol": False },
        { "fieldname": "al_rohs_status_id", "label": "al_rohs_status_id", "isMergeCol": False },
        { "fieldname": "al_mounting_type_id", "label": "al_mounting_type_id", "isMergeCol": False },
        { "fieldname": "al_part_category_id", "label": "al_part_category_id", "isMergeCol": False },
        { "fieldname": "al_distributor", "label": "al_distributor", "isMergeCol": False },
        { "fieldname": "al_dist_mfg_code_id", "label": "al_dist_mfg_code_id", "isMergeCol": False },
        { "fieldname": "al_dist_pn", "label": "al_dist_pn", "isMergeCol": False },
        { "fieldname": "al_dist_mfg_pn_ref", "label": "al_dist_mfg_pn_ref", "isMergeCol": False }
    ]