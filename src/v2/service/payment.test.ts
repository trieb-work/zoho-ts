import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
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

    test("It should work to create a payment", async () => {
        const paymentCreate = await zoho.payment.create({
            payment_persons: [{
                first_name: "Test User",
                last_name: "Lastname",
            }],
            payment_name: "Test User Lastname",
        });
        paymentIds.push(paymentCreate.payment_id);

        expect(paymentCreate.first_name).toBe("Test User");
        expect(paymentCreate.payment_name).toBe("Test User Lastname");
    });

    test("It should work to list all payments", async () => {
        const payments = await zoho.payment.list({})

        expect(payments.length).toBeGreaterThan(0);
        expect(payments[0].payment_id).toBeDefined;
        const searchForpayment = payments.find((x) => x.payment_name === "Test User Lastname")
        expect(searchForpayment?.payment_id).toBeDefined();
    })

    test("It should work to delete a payment", async () => {
        await zoho.payment.delete(paymentIds)
    })
});
