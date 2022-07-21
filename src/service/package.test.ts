import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho

describe("package Tests", () => {

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


    // const packageIds: string[] = [];
    let testUserId: string;
    let testInvoiceId: string;

    // test("It should work to create a package", async () => {

    //     const packageCreate = await zoho.package.create({
    //         date: format(new Date(), "yyyy-MM-dd")
    //     });
    //     packageIds.push(packageCreate.package_id);

    // });

    test("It should work to list all packages", async () => {
        const packages = await zoho.package.list({})

        expect(packages.length).toBeGreaterThan(0);
        expect(packages[0].package_id).toBeDefined;
    })

    // test("It should work to delete a package", async () => {
    //     await zoho.package.delete(packageIds)
    // })
    afterAll(async () => {
        await zoho.invoice.delete([testInvoiceId])
        await zoho.contact.delete([testUserId]);
        
    })
});
