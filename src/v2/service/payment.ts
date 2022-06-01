import { ZohoApiClient } from "../client/client";
import { CreatePayment, Payment } from "../types/payment";
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
            const res = await this.client.get<{ customerpayments: Payment[] }>({
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

            payments.push(...res.customerpayments);
            hasMorePages = !opts.limit
                ? false
                : res.page_context?.has_more_page ?? false;
            page = res.page_context?.page ?? 0 + 1;
        }

        return payments;
    }

    public async create(payment: CreatePayment): Promise<Payment> {
        const res = await this.client.post<{ payment: Payment }>({
            path: ["customerpayments"],
            body: payment,
        });

        return res.payment;
    }

    /**
     * Delete one or several customerpayments at once. Can be used for
     * unlimited amount of customerpayments. Creates chunks of 25
     * @param ids
     * @returns
     */
    public async delete(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["customerpayments", ids[0]],
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
                path: ["customerpayments"],
                params: {
                    salesorder_ids: chunk.join(","),
                },
            });
        }
    }
}
