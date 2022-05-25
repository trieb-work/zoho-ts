import { Warehouse } from "src/types";
import { ZohoApiClient } from "../client/client";

export class WarehouseHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async get(id: string): Promise<Warehouse> {
        const res = await this.client.get<{ warehouse: Warehouse }>({
            path: ["settings", "warehouses", id],
        });

        if (!res.warehouse) {
            throw new Error(`warehouse with id: ${id} was not found`);
        }
        return res.warehouse;
    }

    public async list(): Promise<Warehouse[]> {
        const res = await this.client.get<{ warehouses: Warehouse[] }>({
            path: ["settings", "warehouses"],
        });

        return res.warehouses;
    }
}
