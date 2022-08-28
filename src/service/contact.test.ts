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
    let createdContact :string; 

    test("It should work to create a contact", async () => {

        const contactCreate = await zoho.contact.create({
            contact_persons: [{
                first_name: "Test User",
                last_name: "Lastname",
            }],
            contact_name: "Test User Lastname",
            customer_sub_type: "individual",
            billing_address: {
                address: "Teststreet billing 101",
                zip: "90459",
                country_code: "DE"
            },
            shipping_address: {
                address: "Teststreet shipping 101",
                zip: "90459",
                country_code: "DE"
            }            
            
        });
        contactIds.push(contactCreate.contact_id);
        createdContact = contactCreate.contact_id

        expect(contactCreate.first_name).toBe("Test User");
        expect(contactCreate.contact_name).toBe("Test User Lastname");
    });

    test("It should work to get a certain contact",async () => {

        const contact = await zoho.contact.get(createdContact);

        expect(contact?.shipping_address.address).toBe("Teststreet shipping 101")
        
    })

    test("It should work to list all contacts", async () => {
        const contacts = await zoho.contact.list({})

        expect(contacts.length).toBeGreaterThan(0);
        expect(contacts[0].contact_id).toBeDefined;
        const searchForContact = contacts.find((x) => x.contact_name === "Test User Lastname")
        expect(searchForContact?.contact_id).toBeDefined();
    }, 10000)

    test ("It should work to list the contactpersons of a contact", async () => {
        const response = await zoho.contact.listContactPersons(contactIds[0])
        expect(response.length).toBeGreaterThan(0);
    })

    test("It should work to delete a contact", async () => {
        await zoho.contact.delete(contactIds)
    })
});
