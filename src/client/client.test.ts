import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { ZohoApiClient } from "./client";

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;
const clientIdUS = process.env.ZOHO_CLIENT_ID_US as string;
const clientSecretUS = process.env.ZOHO_CLIENT_SECRET_US as string;

it("works to create a new Zoho Client Instance without specifying the datacenter (using .eu)", async () => {
    
    const client = await ZohoApiClient.fromOAuth({
        orgId,
        client: {
            id: clientId,
            secret: clientSecret,
        },
    });
    expect(client).toBeInstanceOf(ZohoApiClient);
});

it("works to create a new Zoho Client Instance with datacenter .com", async () => {
    
    const client = await ZohoApiClient.fromOAuth({
        orgId,
        client: {
            id: clientIdUS,
            secret: clientSecretUS,
        },
        dc: ".com",
    });
    expect(client).toBeInstanceOf(ZohoApiClient);
});
