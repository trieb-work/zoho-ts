// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from "dotenv";
import { ZohoClientInstance } from "./index";

dotenv.config({ path: "./.env" });

async function main() {
  let contactID: string = "";

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
    contactID = contactData.contact_id;
  });

  it("works to delete the contact again", async () => {
    const deleteData = await client.deleteContact(contactID);
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
  //   console.log(await client.getContactById(id));
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
