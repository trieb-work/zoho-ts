import { ZohoApiClient } from "../client/client";
import {
    CreateItem,
    CreateItemGroup,
    ItemGroup,
    Item,
    GetItem,
    FullCompositeItem,
    ListItem,
} from "../types/item";
import { lastModifiedDateFormat } from "../util/format";

export class ItemHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async get(id: string): Promise<GetItem> {
        const res = await this.client.get<{ item: GetItem }>({
            path: ["items", id],
        });

        if (!res.item) {
            throw new Error(`Item with id: ${id} was not found`);
        }
        return res.item;
    }

    /**
     * Item ID and composite Item IDs are the same - this route just returns the exact mapped items
     * of a composite item
     * @param id
     * @returns
     */
    public async getComposite(id: string): Promise<FullCompositeItem> {
        const res = await this.client.get<{
            composite_item: FullCompositeItem;
        }>({
            path: ["compositeitems", id],
        });

        if (!res.composite_item) {
            throw new Error(`CompositeItem with id: ${id} was not found`);
        }
        return res.composite_item;
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
        /**
         * Filter by only active products
         */
        filterBy?: "active" | "inactive";
        /**
         * Filter for items last modified after this date.
         */
        lastModifiedTime?: Date;
    }): Promise<ListItem[]> {
        const items: ListItem[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ items: ListItem[] }>({
                path: ["items"],
                params: {
                    sort_column: opts.sortColumn ?? "created_time",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    status: opts.filterBy || "",
                    last_modified_time: opts.lastModifiedTime
                        ? lastModifiedDateFormat(opts.lastModifiedTime)
                        : "",
                },
            });

            items.push(...res.items);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;
        }

        return items;
    }

    /**
     * Create a new item.
     * @param item
     * @returns
     */
    public async create(item: CreateItem): Promise<Item> {
        const res = await this.client.post<{ item: Item }>({
            path: ["items"],
            body: item,
        });

        return res.item;
    }

    /**
     * Create a new Itemgroup with Items
     * @param itemgroup
     * @returns
     */
    public async createGroup(itemgroup: CreateItemGroup): Promise<ItemGroup> {
        const res = await this.client.post<{ item_group: ItemGroup }>({
            path: ["itemgroups"],
            body: itemgroup,
        });

        return res.item_group;
    }

    /**
     * Delete an item_group and all items of it
     * @param id
     */
    public async deleteGroup(id: string): Promise<void> {
        await this.client.delete({
            path: ["itemgroups", id],
        });
    }
}
