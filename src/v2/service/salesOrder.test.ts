import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
import { randomInt } from "crypto";

dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho
let testUserId: string;

describe("SalesOrder Tests", () => {
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



    const salesOrderIds: string[] = [];

    test ("It should work to create a salesOrder", async () => {
        const testUser = await zoho.contact.create({ contact_name: "Test Run User Zoho TS", customer_sub_type: "individual" })
        testUserId = testUser.contact_id;

        const salesOrder = await zoho.salesOrder.create({
            salesorder_number: ["TEST", randomInt(90000)].join("-"),
            customer_id: testUser.contact_id,
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                },
            ],
        });
        salesOrderIds.push(salesOrder.salesorder_id)
        expect(salesOrder.customer_id).toBe(testUser.contact_id);

    })


    
    test("It should work to set a custom Field Value", async () => {
  
        await zoho.salesOrder.setCustomFieldValue({
            customFieldName: "cf_orderhash",
            salesOrderIds: [salesOrderIds[0]],
            value: "bcc",
        });
        const result = await zoho.salesOrder.get(salesOrderIds[0])
        expect(result.custom_fields.find((x) => x.api_name === "cf_orderhash")?.value).toBe("bcc");

    })

    test("It should work to list salesorder sorted by last_update_date", async () => {
        const res = await zoho.salesOrder.list({ sortColumn: "last_modified_time", createdDateStart: "2022-01-01"})
        expect(res.length).toBeGreaterThan(0);

    })

    test("IT should work to delete a salesorder", async () => {
        await zoho.salesOrder.delete(salesOrderIds);

    });

    afterAll(async () => {
        await zoho.contact.delete([testUserId]);

    })


});