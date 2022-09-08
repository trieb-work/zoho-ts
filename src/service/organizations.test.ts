import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";

dotenv.config({ path: "./.env" });

const orgIdUS = process.env.ZOHO_ORGANIZATION_ID_US as string;
const clientIdUS = process.env.ZOHO_CLIENT_ID_US as string;
const clientSecretUS = process.env.ZOHO_CLIENT_SECRET_US as string;

let zoho: Zoho;
// let testUserId: string;

describe("Organization Tests", () => {
    beforeAll(async () => {
        const client = await ZohoApiClient.fromOAuth({
            orgId: orgIdUS,
            client: {
                id: clientIdUS,
                secret: clientSecretUS,
            },
            dc: ".com"
        });
        zoho = new Zoho(client);
    });

    test("It should work to pull an org from the US datacenter", async () => {
        const res = await zoho.organization.list();

        expect(res[0].organization_id).toBe(orgIdUS)

    });
});
