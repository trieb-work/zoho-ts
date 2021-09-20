// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from "dotenv";
import { ZohoClientInstance } from "./index";

dotenv.config({ path: "./.env" });

async function main() {
  let testingContactID: string = "";
  const testProductSku: string = process.env.TEST_PRODUCT_SKU || "";
  let testProductId: string = "";
  let testSalesOrderId: string = "";
  let secondTestSalesOrderId: string = "";
  const readyToFulfillCustomFieldId = "116240000000112068";

  const client = new ZohoClientInstance({
    zohoClientId: process.env.ZOHO_CLIENT_ID!,
    zohoClientSecret: process.env.ZOHO_CLIENT_SECRET!,
    zohoOrgId: process.env.ZOHO_ORGANIZATION_ID!,
  });

  const multipleSalesOrdersIdArray: string[] = [];

  it("works to authenticate", async () => {
    await client.authenticate();
  });

  it("works to create a customer", async () => {
    const contactData = await client.createContact({
      contact_type: "customer",
      contact_name: "Jest Test User",
      company_name: "Jest Company",
      contact_persons: [{ first_name: "Jest", last_name: "User" }],
    });
    expect(contactData.contact_person_id).toBeDefined();
    testingContactID = contactData.contact_id;
  });

  it("works to get a contact by id", async () => {
    const getContactData = await client.getContactById(testingContactID);
    expect(getContactData.first_name).toBe("Jest");
  });

  it("works to look-up a product by SKU", async () => {
    const productData = await client.getItembySKU({
      product_sku: testProductSku,
    });
    expect(productData.zohoItemId).toBeDefined();

    testProductId = productData.zohoItemId;
  });

  it("works to create a salesorder for the new contact", async () => {
    try {
      const salesOrderCreateData = await client.createSalesorder({
        salesorder_number: "TEST-24",
        customer_id: testingContactID,
        line_items: [{ item_id: testProductId, quantity: 1 }],
      });
      expect(salesOrderCreateData.salesorder_number).toBe("TEST-24");
      testSalesOrderId = salesOrderCreateData.salesorder_id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it("works to create a second salesorder for the new contact", async () => {
    try {
      const salesOrderCreateData = await client.createSalesorder({
        salesorder_number: "TEST-25",
        customer_id: testingContactID,
        line_items: [{ item_id: testProductId, quantity: 1 }],
      });
      expect(salesOrderCreateData.salesorder_number).toBe("TEST-25");
      secondTestSalesOrderId = salesOrderCreateData.salesorder_id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  /**
   * Create some salesorders etc. to later test bulk delete, update etc.
   */
  it("works to create 20 salesorders for further testing", async () => {
    const testArray = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const x of testArray) {
      // eslint-disable-next-line no-await-in-loop
      const response = await client.createSalesorder({
        salesorder_number: `MULTI-${x}`,
        customer_id: testingContactID,
        line_items: [{ item_id: testProductId, quantity: 1 }],
      });
      multipleSalesOrdersIdArray.push(response.salesorder_id);
    }
    expect(multipleSalesOrdersIdArray.length).toBe(20);
  }, 20000);

  it("works to search for several salesorders with a string", async () => {
    const searchResult = await client.searchSalesOrdersWithScrolling("TEST-");
    expect(
      searchResult.find((x) => x.salesorder_number === "TEST-25")
        ?.salesorder_number,
    ).toBe("TEST-25");
  });

  it("works to bulk update two salesorders at once", async () => {
    const updateResult = await client.bulkUpdateSalesOrderCustomField(
      [testSalesOrderId, secondTestSalesOrderId],
      readyToFulfillCustomFieldId,
      true,
    );
    updateResult.map((x) => expect(x.salesperson_id).toBeDefined());
  });

  it("works to delete a salesorder again", async () => {
    const deleteSalesorderResult = await client.deleteSalesorder(
      testSalesOrderId,
    );
    expect(deleteSalesorderResult).toBeTruthy();
  });

  it("works to delete multiple salesorders at once", async () => {
    multipleSalesOrdersIdArray.push(secondTestSalesOrderId);
    const deleteSalesOrdersResult = await client.bulkDeleteSalesOrders(
      multipleSalesOrdersIdArray,
    );
    expect(deleteSalesOrdersResult).toBeTruthy();
  });

  it("works to add a contact person to a contact", async () => {
    const contactPersonId = await client.createContactPerson(testingContactID, {
      first_name: "Testing",
      last_name: "Person",
      email: "testing@contact-person.de",
    });
    expect(contactPersonId).toBeDefined();
  });

  it("works to delete the contact again", async () => {
    const deleteData = await client.deleteContact(testingContactID);
    expect(deleteData).toBeTruthy();
  });
}
main();
