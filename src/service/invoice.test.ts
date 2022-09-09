import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";

dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho: Zoho;
let testUserId: string;
let testUserContactPerson: string;
let testSalesOrderId: string;
let testSalesOrderTotal: number;

describe("invoice Tests", () => {
    beforeAll(async () => {
        const client = await ZohoApiClient.fromOAuth({
            orgId,
            client: {
                id: clientId,
                secret: clientSecret,
            },
        });
        zoho = new Zoho(client);
    });

    const invoiceIds: string[] = [];

    test("It should work to create a invoice", async () => {
        const testUser = await zoho.contact.create({
            contact_name: "Test Run User Zoho TS",
            customer_sub_type: "individual",
            contact_persons: [
                {
                    email: "testuser@trieb.work",
                    first_name: "Jest",
                    last_name: "Runner",
                },
            ],
        });
        testUserId = testUser.contact_id;
        testUserContactPerson = testUser.contact_persons[0].contact_person_id;

        const invoice = await zoho.invoice.create({
            customer_id: testUser.contact_id,
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                },
            ],
        });
        invoiceIds.push(invoice.invoice_id);
        expect(invoice.customer_id).toBe(testUser.contact_id);
    });

    test("it should work to create an invoice from a salesorder", async () => {
        const salesOrderCreate = await zoho.salesOrder.create({
            customer_id: testUserId,
            contact_persons: [testUserContactPerson],
            discount_type: "entity_level",
            salesorder_number: "TEST-34003594",
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                    discount: 10,
                },
            ],
        });
        testSalesOrderId = salesOrderCreate.salesorder_id;
        testSalesOrderTotal = salesOrderCreate.total;

        const invoice = await zoho.invoice.createFromSalesOrder(
            salesOrderCreate.salesorder_id,
        );
        invoiceIds.push(invoice.invoice_id);
        expect(invoice.invoice_id).toBeDefined();
        expect(invoice.contact_persons_details.length).toBe(1);
        expect(invoice.reference_number).toBe("TEST-34003594");
        expect(invoice.total).toBe(testSalesOrderTotal);
    });

    test("It should work to list invoice sorted by last_update_date", async () => {
        const res = await zoho.invoice.list({
            sortColumn: "last_modified_time",
            createdDateStart: "2022-01-01",
        });
        expect(res.length).toBeGreaterThan(0);
    });

    test("It should work to mark invoices as sent", async () => {
        await zoho.invoice.sent(invoiceIds);
        const allInvoices = await zoho.invoice.list({});
        for(const invoiceId of invoiceIds){
            const invoice = allInvoices.find((inv) => inv.invoice_id === invoiceId);
            if(invoice?.status !== "sent") {
                throw new Error(`Invoice with id ${invoiceId} was marked as status sent but did not have status sent in status check.`);
            }
        }
    });

    test("It should work to delete invoices", async () => {
        await zoho.invoice.delete(invoiceIds);
        const allInvoices = await zoho.invoice.list({});
        for(const invoiceId of invoiceIds){
            const invoice = allInvoices.find((inv) => inv.invoice_id === invoiceId);
            if(invoice) {
                throw new Error(`Invoice with id ${invoiceId} was deleted by test but was still returned by the search.`);
            }
        }
    });

    afterAll(async () => {
        await zoho.salesOrder.delete([testSalesOrderId]);
        await zoho.contact.delete([testUserId]);
    });
});
