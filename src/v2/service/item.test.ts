import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";

dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho
let testUserId: string;

describe("Item Tests", () => {
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



    const itemIds: string[] = [];

    test ("It should work to create an article", async () => {
        const testUser = await zoho.contact.create({ contact_name: "Test Run User Zoho TS" })
        testUserId = testUser.contact_id;

        const item = await zoho.item.create({
            customer_id: testUser.contact_id,
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                },
            ],
        });
        itemIds.push(item.Item_id)
        expect(item.customer_id).toBe(testUser.contact_id);

    })



    test("It should work to list Item sorted by last_update_date", async () => {
        const res = await zoho.item.list({ sortColumn: "last_modified_time" })
        expect(res.length).toBeGreaterThan(0);
    })

    test("It should work to list only inactive items", async () => {
        const res = await zoho.item.list({ filterBy: "inactive" })
        expect(res.length).toBeGreaterThan(0);
        expect(res[0].status === "inactive")
    })

    test("It should work to delete a item", async () => {
        await zoho.item.delete(itemIds);

    });

    afterAll(async () => {
        await zoho.contact.delete([testUserId]);

    })


});