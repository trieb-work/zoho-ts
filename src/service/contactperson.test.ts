import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho

describe("ContactPerson Tests", () => {

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
    let contactPersonId: string

    test("It should work to create a contact and add a contact person", async () => {
        const contactCreate = await zoho.contact.create({
            contact_persons: [{
                first_name: "Test User",
                last_name: "Lastname",
                is_primary_contact: true,
            }],
            contact_name: "Test User Lastname",
            customer_sub_type: "individual",
        });
        contactIds.push(contactCreate.contact_id);

        expect(contactCreate.first_name).toBe("Test User");
        expect(contactCreate.contact_name).toBe("Test User Lastname");

        const contactPersonCreate = await zoho.contactperson.create({
            contact_id: contactCreate.contact_id,
            first_name: "",
            last_name: "Contactpersontest"
        })
        expect(contactPersonCreate.last_name).toBe("Contactpersontest")
        contactPersonId = contactPersonCreate.contact_person_id;
    });

    // test("It should work to list all contact persons of a contact", async () => {
    //     const contactPersons = await zoho.contactperson.list(contactIds[0]);

    //     expect(contactPersons.length).toBeGreaterThan(0);
    //     expect(contactPersons[0].contact_id).toBeUndefined;

    // })
    test("It should work to list all contact persons", async () => {
        const contactPersons = await zoho.contactperson.list();

        expect(contactPersons.length).toBeGreaterThan(0);
        expect(contactPersons[0].contact_id).toBeDefined;
    })

    test("It should work to delete a contactPerson", async () => {
        await zoho.contactperson.delete(contactPersonId)
        await zoho.contact.delete(contactIds)
    })
});
