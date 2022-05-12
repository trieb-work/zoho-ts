import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho

describe("Contact Tests", () => {

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


    const contactIds: string[] = [];

    test("It should work to create a contact", async () => {
        const contactCreate = await zoho.contact.create({
            contact_persons: [{
                first_name: "Test User",
                last_name: "Lastname",
            }],
            contact_name: "Test User Lastname",
        });
        contactIds.push(contactCreate.contact_id);

        expect(contactCreate.first_name).toBe("Test User");
        expect(contactCreate.contact_name).toBe("Test User Lastname");
    });

    test("It should work to delete a contact", async () => {
        await zoho.contact.delete(contactIds)
    })
});
