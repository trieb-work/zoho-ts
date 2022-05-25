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
            params: {
                ignore_auto_number_generation: invoice.invoice_number
                    ? true
                    : false,
            },
        });

        return res.invoice;
    }

    /**
     * List invoice using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
     * Limit the total result using the fields "createdDateStart" (GTE) or "createdDateEnd" (LTE)
     * @param opts
     * @returns
     */
    public async list(opts: {
        sortColumn?: "date" | "created_time" | "last_modified_time" | "total";
        sortOrder?: "ascending" | "descending";
        limit?: number;
        /**
         * yyyy-mm-dd
         */
        createdDateStart?: `${number}-${number}-${number}`;
        /**
         * yyyy-mm-dd
         */
        createdDateEnd?: `${number}-${number}-${number}`;
    }): Promise<Invoice[]> {
        const invoices: Invoice[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ invoices: Invoice[] }>({
                path: ["invoices"],
                params: {
                    sort_column: opts.sortColumn ?? "date",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    created_date_start: opts.createdDateStart || "",
                    created_date_end: opts.createdDateEnd || "",
                },
            });

            invoices.push(...res.invoices);
            hasMorePages = !opts.limit
                ? false
                : res.page_context?.has_more_page ?? false;
            page = res.page_context?.page ?? 0 + 1;
        }

        return invoices;
    }

    /**
     * Get a single invoice by ID
     * @param id
     * @returns
     */
    public async get(id: string): Promise<Invoice> {
        const res = await this.client.get<{ invoice: Invoice }>({
            path: ["invoices", id],
        });

        return res.invoice;
    }

    /**
     * Delete one or several invoices at once. Can be used for
     * unlimited amount of invoices. Creates chunks of 25
     * @param ids
     * @returns
     */
    public async delete(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["invoices", ids[0]],
            });
            return;
        }

        const chunkSize = 25;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
            chunks.push(ids.slice(i, i + chunkSize));
        }
        for (const chunk of chunks) {
            await this.client.delete({
                path: ["invoices"],
                params: {
                    salesorder_ids: chunk.join(","),
                },
            });
        }
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