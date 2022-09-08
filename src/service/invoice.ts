import { sleep } from "../util/retry";
import { ZohoApiClient } from "../client/client";
import { Invoice, CreateInvoice, ListInvoice } from "../types/invoice";

/**
 * The Handler class for all functionality concerning Zoho
 * Invoices
 */
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
    public async list(
        opts:
            | {
                  sortColumn?:
                      | "date"
                      | "created_time"
                      | "last_modified_time"
                      | "total";
                  sortOrder?: "ascending" | "descending";
                  /**
                   * yyyy-mm-dd
                   */
                  createdDateStart?: string;
                  /**
                   * yyyy-mm-dd
                   */
                  createdDateEnd?: string;
                  /**
                   * Filter Invoices by a specific Custom View ID
                   */
                  customViewId?: string;
              }
            | undefined,
    ): Promise<ListInvoice[]> {
        const invoices: ListInvoice[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ invoices: ListInvoice[] }>({
                path: ["invoices"],
                params: {
                    sort_column: opts?.sortColumn ?? "date",
                    sort_order: opts?.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    created_date_start: opts?.createdDateStart || "",
                    created_date_end: opts?.createdDateEnd || "",
                    customview_id: opts?.customViewId || "",
                },
            });

            invoices.push(...res.invoices);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;
            /**
             * Sleep to not get blocked by Zoho
             */
            await sleep(1000);
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
                    invoice_ids: chunk.join(","),
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
