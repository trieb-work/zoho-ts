import { randomInt } from "crypto";
import { format } from "date-fns";
import dotenv from "dotenv";
import { Zoho } from ".";
import { ZohoApiClient, ZohoApiError } from "../client/client";
import { SalesOrder } from "../types";
import { QuickCreateInput } from "../types/package";
dotenv.config({ path: "./.env" });

const orgId = process.env.ZOHO_ORGANIZATION_ID as string;
const clientId = process.env.ZOHO_CLIENT_ID as string;
const clientSecret = process.env.ZOHO_CLIENT_SECRET as string;

let zoho :Zoho

describe("package Tests", () => {

    const packageIds: string[] = [];
    let testUserId: string;
    let testSalesOrderId: string;
    let testSalesOrders: SalesOrder[] = [];
    let testShipmentOrderIds: string[] = [];

    beforeAll(async () => {
        const client = await ZohoApiClient.fromOAuth({
            orgId,
            client: {
                id: clientId,
                secret: clientSecret,
            },
        });
        zoho = new Zoho(client);

        // create a salesorder for which we create the package
        const testUser = await zoho.contact.create({ contact_name: "Test Run User Zoho TS", customer_sub_type: "individual" })
        testUserId = testUser.contact_id;

    })




    test("It should work to create a package", async () => {


        const salesOrder = await zoho.salesOrder.create({
            salesorder_number: ["TEST", randomInt(90000)].join("-"),
            customer_id: testUserId,
            line_items: [
                {
                    item_id: "116240000000203041",
                    quantity: 5,
                },
            ],
        });
        testSalesOrderId = salesOrder.salesorder_id;
        testSalesOrders.push(salesOrder);

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
                so_line_item_id: testSalesOrders[0].line_items[0].line_item_id,
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
        testShipmentOrderIds.push(shipmentCreate.shipment_id);

    });


    test("It should work to list all packages", async () => {
        const packages = await zoho.package.list({})

        expect(packages.length).toBeGreaterThan(0);
        expect(packages[0].package_id).toBeDefined;
        expect(packages.filter((p) => p.package_id === packageIds[0])).toBeDefined()

    })

    test ("It should work to mark a package as delivered",async () => {
        await expect(zoho.package.markDelivered(testShipmentOrderIds[0], new Date())).resolves.not.toThrow()
        const testpackage = await zoho.package.get(packageIds[0])

        expect(testpackage?.status).toBe("delivered")
    })  
    
    test ("It should fail correctly when marking a package a second time as delivered", async () => {

        await expect(zoho.package.markDelivered(testShipmentOrderIds[0], new Date())).rejects.toBeInstanceOf(ZohoApiError)
    })  

    test("It should work to create 3 packages for 3 salesorders with one API call", async () => {
        let x = 0
        const quickShipmentSalesOrderIds :string[] = []
        while (x < 3) {
            const salesOrder = await zoho.salesOrder.create({
                salesorder_number: ["TEST", randomInt(90000)].join("-"),
                customer_id: testUserId,
                line_items: [
                    {
                        item_id: "116240000000203041",
                        quantity: 5,
                    },
                ],
            });
            quickShipmentSalesOrderIds.push(salesOrder.salesorder_id)
            testSalesOrders.push(salesOrder)
            x += 1
        }
        const inputArray :QuickCreateInput = quickShipmentSalesOrderIds.map((s, index) => {
            return {
                salesorder_id: s,
                tracking_number: `903952${index}`,
                carrier: "DPD"
            }
        })

        await zoho.package.bulkCreateQuickShipment(inputArray);

        for (const s of quickShipmentSalesOrderIds) {
            const salesorder = await zoho.salesOrder.get(s)

            expect(salesorder.packages[0].tracking_number).toMatch(/903952/)

            testShipmentOrderIds.push(salesorder.packages[0].shipment_id)
            packageIds.push(salesorder.packages[0].package_id)

        }


    }, 10000)

    test("It should work to delete a shipmentorder", async () => {
        await zoho.package.deleteShipmentOrder(testShipmentOrderIds)
    })
    test("It should work to delete a package", async () => {
        await zoho.package.delete(packageIds)
    })
    afterAll(async () => {
        await zoho.salesOrder.delete(testSalesOrders.map((x) => x.salesorder_id))
        await zoho.contact.delete([testUserId]);  
    })
});
