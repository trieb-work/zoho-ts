import { ZohoApiClient } from "../client/client";
import { Item } from "../types";
export class ItemHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async get(id: string): Promise<Item> {
        const res = await this.client.get<{ item: Item }>({
            path: ["items", id],
        });

        if (!res.item) {
            throw new Error(`Item with id: ${id} was not found`);
        }
        return res.item;
    }

    /**
     * List invoice using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
     * Limit the total result using the fields "createdDateStart" (GTE) or "createdDateEnd" (LTE)
     * @param opts
     * @returns
     */
    public async list(opts: {
        sortColumn?: "created_time" | "last_modified_time";
        sortOrder?: "ascending" | "descending";
        limit?: number;
        /**
         * Filter by only active products
         */
        filterBy?: "active" | "inactive";
    }): Promise<Item[]> {
        const items: Item[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ items: Item[] }>({
                path: ["items"],
                params: {
                    sort_column: opts.sortColumn ?? "created_time",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    status: opts.filterBy || "",
                },
            });

            items.push(...res.items);
            hasMorePages = !opts.limit
                ? false
                : res.page_context?.has_more_page ?? false;
            page = res.page_context?.page ?? 0 + 1;
        }

        return items;
    }
}
