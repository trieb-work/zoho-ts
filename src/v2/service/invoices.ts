import { ZohoApiClient } from "../client/client";
import { Invoice } from "../types";
import { CreateInvoice } from "../types/invoice";

export class InvoiceHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async create(invoice: CreateInvoice): Promise<Invoice> {
        const res = await this.client.post<{ invoice: Invoice }>({
            path: ["invoices"],
            body: invoice,
        });

        return res.invoice;
    }

    /**
     * Generate an invoice from a salesorder.
     * @param id SalesorderID
     * @returns
     */
    public async createFromSalesOrder(id: string): Promise<Invoice> {
        const res = await this.client.post<{ invoice: Invoice }>({
            path: ["invoices", "fromsalesorder"],
            params: {
                salesorder_id: id,
            },
        });
        return res.invoice;
    }
}
