import { ZohoApiClient } from "../client/client";
import { Payment } from "../types/payment";
export class PaymentHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async get(id: string): Promise<Payment | null> {
        const res = await this.client.get<{ payment: Payment }>({
            path: ["customerpayments", id],
        });

        return res.payment;
    }

    /**
     * List payment using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
     * @param opts
     * @returns
     */
    public async list(opts: {
        sortColumn?: "date" | "created_time" | "last_modified_time" | "total";
        sortOrder?: "ascending" | "descending";
        limit?: number;
        /**
         * yyyy-mm-dd - the date of the payment. Not the date it was created!
         */
        dateStart?: `${number}-${number}-${number}`;
        /**
         * yyyy-mm-dd - the date of the payment. Not the date it was created!
         */
        dateEnd?: `${number}-${number}-${number}`;
    }): Promise<Payment[]> {
        const payments: Payment[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ payments: Payment[] }>({
                path: ["customerpayments"],
                params: {
                    sort_column: opts.sortColumn ?? "date",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    date_start: opts.dateStart || "",
                    date_end: opts.dateEnd || "",
                },
            });

            payments.push(...res.payments);
            hasMorePages = !opts.limit
                ? false
                : res.page_context?.has_more_page ?? false;
            page = res.page_context?.page ?? 0 + 1;
        }

        return payments;
    }
}
