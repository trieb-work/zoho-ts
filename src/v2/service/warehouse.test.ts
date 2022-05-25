import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";

dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho
let warehouseId: string;


beforeAll(async () => {

    const client = await ZohoApiClient.fromOAuth({
        orgId,
        client: {
            id: clientId,
            secret: clientSecret,
        },
    });
    zoho = new Zoho(client);

})

test("It should work to list all Warehouses", async () => {
    const res = await zoho.warehouse.list();

    expect(res.length).toBeGreaterThan(0);
    warehouseId = res[0].warehouse_id

});

test("It should work to get one warehouse", async () => {
    const res = await zoho.warehouse.get(warehouseId)
    expect(res.warehouse_id).toBeDefined;
})