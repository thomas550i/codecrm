import frappe
from pypika import Criterion


@frappe.whitelist()
def get_views(doctype):
	View = frappe.qb.DocType("CRM View Settings")
	query = (
		frappe.qb.from_(View)
		.select("*")
		.where(Criterion.any([View.user == "", View.user == frappe.session.user]))
	)
	if doctype:
		query = query.where(View.dt == doctype)
	views = query.run(as_dict=True)
	return views

@frappe.whitelist()
def get_field_meta(doctype, fieldname):
    meta = frappe.get_meta(doctype)
    for field in meta.fields:
        if field.fieldname == fieldname:
            return {
                "fieldtype": field.fieldtype,
                "label": field.label,
                "options": field.options,
				"fieldname":field.name
            }
    return {}
