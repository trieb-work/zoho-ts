import { ZohoApiClient } from "../client/client";
import { Tax } from "../types/tax";

export class TaxHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    /**
     * List all current active taxes
     * @returns
     */
    public async list(): Promise<Tax[]> {
        const res = await this.client.get<{ taxes: Tax[] }>({
            path: ["settings", "taxes"],
        });

        return res.taxes;
    }
}
