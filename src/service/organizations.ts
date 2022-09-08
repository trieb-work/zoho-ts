import { ZohoApiClient } from "src/client/client";
import { Organization } from "src/types/organizations";

export class OrganizationHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async list() {
        const res = await this.client.get<{ organizations: Organization[] }>({
            path: ["organizations"],
        });

        return res.organizations;
    }
}
