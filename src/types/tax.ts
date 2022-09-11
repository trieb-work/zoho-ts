/**
 * Number of taxes applied on sales order
 */
export type Tax = {
    tax_type: "tax";
    tax_specific_type: "";
    output_tax_account_name: string;
    purchase_tax_account_name: string;
    tax_account_id: string;
    /**
     * Only visible if you have seperated
     * tax tracking active
     */
    purchase_tax_account_id: string;
    is_value_added: true;
    is_default_tax: false;
    is_editable: true;

    tax_id: string;

    tax_percentage: number;

    /**
     * Name of the tax.
     */
    tax_name: string;
};
