import frappe
from frappe.model.document import Document

class CRMOpportunity(Document):
    @staticmethod
    def default_list_data():
        columns = [
            {
                "label": "Opportunity ID",
                "key": "name",
                "type": "Data",
                "width": "200px"
            },
            {
                "label": "Deal",
                "key": "deal",
                "type": "Link",
                "options": "CRM Deal",
                "width": "200px"
            },
            {
                "label": "Status",
                "key": "status",
                "type": "Select",
                "width": "120px"
            },
            {
                "label": "Expected Closing Date",
                "key": "expected_closing_date",
                "type": "Date",
                "width": "150px"
            },
            {
                "label": "Last Modified",
                "key": "modified",
                "type": "Datetime",
                "width": "8rem"
            },
        ]

        rows = [
            "name",
            "deal",
            "status",
            "expected_closing_date",
            "modified"
        ]

        return {"columns": columns, "rows": rows}

@frappe.whitelist()
def create_opportunity(args):
	deal = frappe.new_doc("CRM Opportunity")

	deal.update(args)

	deal.insert(ignore_permissions=True)
	return deal.name

