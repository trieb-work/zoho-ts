/**
 * Number of taxes applied on sales order
 */
export type Tax = {
    /**
     * Name of the tax applied on the line item.
     */
    tax_name: string;
    /**
     * Amount of the tax.
     */
    tax_amount: number;
};
