import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
import { format, subHours } from "date-fns";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho

describe("payment Tests", () => {

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


    const paymentIds: string[] = [];
    let testUserId: string;
    let testInvoiceId: string;

    test("It should work to create a payment", async () => {
        const testUser = await zoho.contact.create({ contact_name: "Test Run User Zoho TS", customer_sub_type: "individual" })
        testUserId = testUser.contact_id;
        const testInvoice = await zoho.invoice.create({
            customer_id: testUserId,
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                },
            ],
        })
        testInvoiceId = testInvoice.invoice_id;


        const paymentCreate = await zoho.payment.create({
            amount: 1,
            customer_id: testUserId,
            payment_mode: "Banküberweisung",
            invoices: [{ invoice_id: testInvoice.invoice_id, amount_applied: 1}],
            date: format(new Date(), "yyyy-MM-dd")
        });
        paymentIds.push(paymentCreate.payment_id);

    });

    test("It should work to list all payments", async () => {
        const payments = await zoho.payment.list({
            lastModifiedTime: subHours(new Date(), 1),
        })

        expect(payments.length).toBeGreaterThan(0);
        expect(payments[0].payment_id).toBeDefined;
        expect(payments[0].invoice_numbers_array).toBeDefined
    })

    test("It should work to delete a payment", async () => {
        await zoho.payment.delete(paymentIds)
    })
    afterAll(async () => {
        await zoho.invoice.delete([testInvoiceId])
        await zoho.contact.delete([testUserId]);
        
    })
});
