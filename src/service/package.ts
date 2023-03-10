import { format } from "date-fns";
import { sleep } from "../util/retry";
import { ZohoApiClient } from "../client/client";
import {
    CreatePackage,
    CreatePackageRes,
    CreateShipment,
    CreateShipmentRes,
    Package,
    QuickCreateInput,
} from "../types/package";

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
                    per_page: opts.limit ?? "200",
                    page,
                    date_start: opts.createdDateStart || "",
                    date_end: opts.createdDateEnd || "",
                    customview_id: opts.customViewId || "",
                },
            });

            packages.push(...res.packages);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            if (opts.limit && packages.length >= opts.limit) hasMorePages = false;
            page = res.page_context.page + 1 ?? 0 + 1;
        }

        return packages;
    }

    /**
     * Creates a package for a specific salesorder. The shipment for it needs to be created afterwards with "createShipment"
     * @param createPackage
     * @param salesOrderId
     * @returns
     */
    public async create(
        createPackage: CreatePackage,
        salesOrderId: string,
    ): Promise<CreatePackageRes> {
        const res = await this.client.post<{ package: CreatePackageRes }>({
            path: ["packages"],
            params: {
                salesorder_id: salesOrderId,
                ignore_auto_number_generation: createPackage.package_number
                    ? true
                    : false,
            },
            body: createPackage,
        });

        return res.package;
    }

    /**
     * Create up to 25 packages with just one API call. This works only for fully shipped salesorders. Partial shipment is not working.
     * Takes an array of objects as input: { salesorder_id: string; tracking_number: string; carrier: string; }[]. Package and shipment Ids
     * are auto-created. We are sending chunks of 25 to Zoho. Unfortunately, we don't get the package or shipment ids back
     * @param input
     */
    public async bulkCreateQuickShipment(
        input: QuickCreateInput,
    ): Promise<void> {
        const chunkSize = 25;
        const chunks: QuickCreateInput[] = [];
        for (let i = 0; i < input.length; i += chunkSize) {
            chunks.push(input.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            await this.client.post<{ data: [] }>({
                path: ["salesorders", "quickcreate", "shipment"],
                body: {
                    salesorders: chunk,
                },
            });

            await sleep(500);
        }
    }

    /**
     * Create a shipment for a package - ships out a package and adds information like the carrier and tracking number
     * @param createShipment
     * @param salesOrderId
     * @param packageId
     * @param liveTrackingEnabled
     * @returns
     */
    public async createShipment(
        createShipment: CreateShipment,
        salesOrderId: string,
        packageId: string,
        liveTrackingEnabled?: boolean,
    ): Promise<CreateShipmentRes> {
        const res = await this.client.post<{
            shipmentorder: CreateShipmentRes;
        }>({
            path: ["shipmentorders"],
            params: {
                salesorder_id: salesOrderId,
                package_ids: packageId,
                send_notification: false,
                is_tracking_required: liveTrackingEnabled || false,
            },
            body: createShipment,
        });

        return res.shipmentorder;
    }

    /**
     * Mark a package as delivered. If it is already delivered, you receive code 37135
     * @param shipmentOrderId
     * @param time
     * @returns
     */
    public async markDelivered(shipmentOrderId: string, time: Date) {
        const res = await this.client.post<{
            data: {
                statusupdate_error_list: [];
            };
        }>({
            path: ["shipmentorders", shipmentOrderId, "status", "delivered"],
            body: {
                delivered_date: format(time, "yyyy-MM-dd HH:mm"),
            },
        });

        if (res.data.statusupdate_error_list?.length === 0) return;

        throw new Error(
            res?.data?.statusupdate_error_list
                ? JSON.stringify(res.data.statusupdate_error_list)
                : `Error marking package as delivered! Undefined error: ${JSON.stringify(
                      res,
                  )}`,
        );
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

    public async deleteShipmentOrder(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["shipmentorders", ids[0]],
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
                path: ["shipmentorders"],
                params: {
                    shipment_ids: chunk.join(","),
                },
            });
        }
    }
}
