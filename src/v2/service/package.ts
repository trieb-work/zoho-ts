import { ZohoApiClient } from "../client/client";
import { Package } from "../types/package";
export class PackageHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async retrieve(id: string): Promise<Package | null> {
        const res = await this.client.get<{ package: Package }>({
            path: ["packages", id],
        });

        return res.package;
    }
}
