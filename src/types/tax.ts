/**
 * Number of taxes applied on sales order
 */
export type Tax = {
    tax_id: string;

    tax_percentage: number;

    /**
     * Name of the tax.
     */
    tax_name: string;
};
