import { randomInt } from "crypto";
import { format } from "date-fns";
import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient } from "../client/client";
import { SalesOrder } from "../types";
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


    const packageIds: string[] = [];
    let testUserId: string;
    let testSalesOrderId: string;
    let testSalesOrder: SalesOrder;
    let testShipmentOrderId: string;

    test("It should work to create a package", async () => {

        // create a salesorder for which we create the package
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
        testSalesOrderId = salesOrder.salesorder_id;
        testSalesOrder = salesOrder;

        const packageCreate = await zoho.package.create({
            date: format(new Date(), "yyyy-MM-dd"),
            line_items: [{
                so_line_item_id: salesOrder.line_items[0].line_item_id,
                quantity: 3
            }]
        }, testSalesOrderId);
        packageIds.push(packageCreate.package_id);

    });

    test("It should work to create a package with a manual set package number", async () => {
        const packageCreate = await zoho.package.create({
            package_number: "LF-33567434",
            date: format(new Date(), "yyyy-MM-dd"),
            line_items: [{
                so_line_item_id: testSalesOrder.line_items[0].line_item_id,
                quantity: 2
            }]
        }, testSalesOrderId);
        packageIds.push(packageCreate.package_id);
        expect(packageCreate.package_number).toBe("LF-33567434")        

    })

    test("It should work to create a shipmentorder for a package", async () => {
        const shipmentCreate = await zoho.package.createShipment({
            date: format(new Date(), "yyyy-MM-dd"),
            delivery_method: "DHL Germany",
            tracking_number: "92358gfw8reg5",
            aftership_carrier_code: "dhl",
        }, testSalesOrderId, packageIds[0], true)

        expect(shipmentCreate.tracking_number).toBe("92358gfw8reg5")
        testShipmentOrderId = shipmentCreate.shipment_id;

    });


    test("It should work to list all packages", async () => {
        const packages = await zoho.package.list({})

        expect(packages.length).toBeGreaterThan(0);
        expect(packages[0].package_id).toBeDefined;
        expect(packages.filter((p) => p.package_id === packageIds[0])).toBeDefined()

    })

    test ("It should work to mark a package as delivered",async () => {
        await expect(zoho.package.markDelivered(testShipmentOrderId, new Date())).resolves.not.toThrow()
        const testpackage = await zoho.package.get(packageIds[0])

        expect(testpackage?.status).toBe("delivered")
    })    

    test("It should work to delete a shipmentorder", async () => {
        await zoho.package.deleteShipmentOrder([testShipmentOrderId])
    })
    test("It should work to delete a package", async () => {
        await zoho.package.delete(packageIds)
    })
    afterAll(async () => {
        await zoho.salesOrder.delete([testSalesOrderId])
        await zoho.contact.delete([testUserId]);  
    })
});
