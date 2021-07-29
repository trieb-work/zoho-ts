// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from "dotenv";
import { ZohoClientInstance } from "./index";

dotenv.config({ path: "./.env" });

async function main() {
  let testingContactID: string = "";
  const testProductSku: string = process.env.TEST_PRODUCT_SKU || "";
  let testProductId: string = "";
  let testSalesOrderId: string = "";

  const client = new ZohoClientInstance({
    zohoClientId: process.env.ZOHO_CLIENT_ID!,
    zohoClientSecret: process.env.ZOHO_CLIENT_SECRET!,
    zohoOrgId: process.env.ZOHO_ORGANIZATION_ID!,
  });

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

  it("works to delete a salesorder again", async () => {
    const deleteSalesorderResult = await client.deleteSalesorder(
      testSalesOrderId,
    );
    expect(deleteSalesorderResult).toBeTruthy();
  });

  it("works to delete the contact again", async () => {
    const deleteData = await client.deleteContact(testingContactID);
    expect(deleteData).toBeTruthy();
  });

  // try {
  //   console.log(await client.salesOrderEditpage());
  //   const id = await client.getContact({
  //     first_name: "Jannik",
  //     last_name: "Zinkl",
  //     email: "zinkljannik@gmail.com",
  //     company_name: "",
  //   });
  //   console.log("customer", id);

  //   console.log(
  //     await client.getPackagesTotal({ from: "2021-01-01", to: "2021-02-01" }),
  //   );
  //   console.log(await client.getSalesorder("SO-000100"));

  //   const dataRObject = await client.getDocumentBase64StringOrBuffer(
  //     "salesorders",
  //     "116240000000673009",
  //   );
  //   console.log(dataRObject.filename);
  // } catch (error) {
  //   console.error(error);
  // }
}
main();