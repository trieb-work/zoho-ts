import { ZohoApiClient } from "../v2/client/client";
import { Zoho } from "../v2/service/service";

async function main() {
  const client = await ZohoApiClient.fromClientSecret("20070434578", {
    id: "1000.O4V6IZ9VXZ0FE3INNQ8HKLILJBAM0R",
    secret: "7380507184e37a8df4b4074ed2cf7bd8d84b9dca5e",
  });

  const zoho = new Zoho(client);

  const salesOrder = await zoho
    .createSalesOrder({
      salesorder_number: "abc",
      customer_id: "116240000001024711",
      line_items: [
        {
          item_id: "116240000000203041",
          quantity: 5,
        },
      ],
    })
    .catch((err) => {
        console.error(err);
    });

  console.log(JSON.stringify(salesOrder, null, 2));
}

main();
