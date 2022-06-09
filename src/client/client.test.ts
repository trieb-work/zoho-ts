import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { ZohoApiClient } from "./client";

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

it("works to create a new Zoho Client Instance", async () => {
    
    const client = await ZohoApiClient.fromOAuth({
        orgId,
        client: {
            id: clientId,
            secret: clientSecret,
        },
    });
    expect(client).toBeInstanceOf(ZohoApiClient);
});
