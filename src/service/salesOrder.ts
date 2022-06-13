import { ZohoApiClient } from "../client/client";
import {
    SalesOrder,
    CreateSalesOrder,
    UpdateSalesOrder,
} from "../types/salesOrder";
import type { RequireOnlyOne } from "./util";

/**
 * The Handler class for all functionality concerning Zoho
 * SalesOrders
 */
export class SalesOrderHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async create(salesOrder: CreateSalesOrder): Promise<SalesOrder> {
        const res = await this.client.post<{ salesorder: SalesOrder }>({
            path: ["salesorders"],
            body: salesOrder,
            params: {
                ignore_auto_number_generation: true,
            },
        });

        return res.salesorder;
    }

    /**
     * List SalesOrder using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
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
        createdDateStart?: string;
        /**
         * yyyy-mm-dd
         */
        createdDateEnd?: string;
        /**
         * Filter Salesorder by a specific Custom View ID
         */
        customViewId?: string;
    }): Promise<SalesOrder[]> {
        const salesOrders: SalesOrder[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ salesorders: SalesOrder[] }>({
                path: ["salesorders"],
                params: {
                    sort_column: opts.sortColumn ?? "date",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    created_date_start: opts.createdDateStart || "",
                    created_date_end: opts.createdDateEnd || "",
                    customview_id: opts.customViewId || "",
                },
            });

            salesOrders.push(...res.salesorders);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;
        }

        return salesOrders;
    }

    public async update(salesOrder: UpdateSalesOrder): Promise<SalesOrder> {
        const res = await this.client.put<{ salesorder: SalesOrder }>({
            path: ["salesorders", salesOrder.salesorder_id.toString()],
            body: salesOrder,
        });

        return res.salesorder;
    }

    /**
     * Get a single salesorder by ID.
     * @param id
     * @returns
     */
    public async get(id: string): Promise<SalesOrder> {
        const res = await this.client.get<{ salesorder: SalesOrder }>({
            path: ["salesorders", id],
            headers: {
                "X-ZB-SOURCE": "zbclient",
            },
        });

        return res.salesorder;
    }

    /**
     * Delete one or several sales orders at once. Can be used for
     * unlimited amount of sales orders. Creates chunks of 25
     * @param ids
     * @returns
     */
    public async delete(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["salesorders", ids[0]],
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
                path: ["salesorders"],
                params: {
                    salesorder_ids: chunk.join(","),
                },
            });
        }
    }

    /**
     * Confirm one ore many salesorders at once. Can be used for unlimited amount of SalesOrders. Creates chunks of 25.
     * @param ids
     */
    public async confirm(ids: string[]): Promise<void> {
        const chunkSize = 25;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
            chunks.push(ids.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            await this.client.post<{ salesorder: SalesOrder }>({
                path: ["salesorders", "status", "confirmed"],
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: `salesorder_ids=${encodeURIComponent(chunk.join(","))}`,
            });
        }
    }

    public async markVoid(ids: string[]): Promise<void> {
        const chunkSize = 25;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
            chunks.push(ids.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            await this.client.post<{ salesorder: SalesOrder }>({
                path: ["salesorders", "status", "void"],
                body: {
                    salesorder_ids: chunk.join(","),
                },
            });
        }
    }

    /**
     * Set custom field values of one or many sales orders. Use the API_Name of the custom field in the Zoho settings
     * e.g. "cf_custom_field"
     * @param opts
     */
    public async setCustomFieldValue(
        opts: RequireOnlyOne<
            {
                customFieldId?: never;
                customFieldName?: string;

                salesOrderIds: string[];
                value: number | string | boolean;
            },
            "customFieldId" | "customFieldName"
        >,
    ): Promise<void> {
        await this.client.put<{ salesorder: SalesOrder }>({
            path: ["salesorders"],
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: `bulk_update=true&JSONString=${JSON.stringify({
                custom_fields: [
                    {
                        [opts.customFieldId ? "customfield_id" : "api_name"]:
                            opts.customFieldId ?? opts.customFieldName,
                        value: opts.value,
                    },
                ],
                salesorder_id: opts.salesOrderIds.join(","),
            })}`,
        });
    }

    /**
     * Search for a salesOrder number containing the search fragment
     * @param fragment
     * @returns
     */
    public async search(fragment: string): Promise<SalesOrder[]> {
        const salesOrders: SalesOrder[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ salesorders: SalesOrder[] }>({
                path: ["salesorders"],
                params: {
                    salesorder_number_contains: fragment,
                    page,
                },
            });

            salesOrders.push(...res.salesorders);
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context?.page ?? 0 + 1;
        }
        return salesOrders;
    }
}
