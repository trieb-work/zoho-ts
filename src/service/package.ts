import { ZohoApiClient } from "../client/client";
import { Package } from "../types/package";
export class PackageHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async get(id: string): Promise<Package | null> {
        const res = await this.client.get<{ package: Package }>({
            path: ["packages", id],
        });

        return res.package;
    }

    /**
     * List package using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
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
         * Filter package by a specific Custom View ID
         */
        customViewId?: string;
    }): Promise<Package[]> {
        const packages: Package[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ packages: Package[] }>({
                path: ["packages"],
                params: {
                    sort_column: opts.sortColumn ?? "date",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    date_start: opts.createdDateStart || "",
                    date_end: opts.createdDateEnd || "",
                    customview_id: opts.customViewId || "",
                },
            });

            packages.push(...res.packages);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;
        }

        return packages;
    }

    /**
     * Delete one or several packages at once. Can be used for
     * unlimited amount of packages. Creates chunks of 25. You always need
     * to delete a corresponding shipment before the package can be deleted
     * @param ids
     * @returns
     */
    public async delete(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["packages", ids[0]],
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
                path: ["packages"],
                params: {
                    package_ids: chunk.join(","),
                },
            });
        }
    }
}
