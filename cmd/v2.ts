import { randomInt } from "crypto";
import { ZohoApiClient } from "../src/v2/client/client";
import { Zoho } from "../src/v2/service";

async function main() {
  const client = await ZohoApiClient.fromBrowserCookies({
    orgId: "20070434578",
    cookie:
      "_iamadt=ae77f9993781cab3f707d0ca3d4dcc7c8c17eaf8a28f018591830e9481a25c62bfc27152e96048a1b22c868727fe7a4247cb857a8738e38255ae979e8790d614; _iambdt=04ddd2248638fdb3161c1f9252c44fa6a95772397f88c4761900ea6a622bbad2d17970333dc4066e57c92323c154a3dd1369959ff535e3e783c8b8d1107e2f75; BuildCookie_AssetType=modern; zohocares-_zldp=YfEOFpfOAG%2BhT3YzXAnuAKQBVvE9HYTh5b31kHjjc2e2RGIRFtjEZX%2FXt4msF6FbuUTTrkKWZt4%3D; zohocares-_uuid=1877bb12-835f-4eef-af6c-82ac319dcf2a_b732; 3deff6f94e=f587616fe4f86e9b5cd0e6b1849dec11; zomcscook=1c6af2fcf50076a288ae251b35c6a58d1e94a190b3057cfbf491b257fa7aed426ff8020391feee31c38260653b2e9b621bd28afcd14c39df5e3c4f3a5446e1f1; _zcsr_tmp=1c6af2fcf50076a288ae251b35c6a58d1e94a190b3057cfbf491b257fa7aed426ff8020391feee31c38260653b2e9b621bd28afcd14c39df5e3c4f3a5446e1f1; MU=2-e3dccad87c6655b8b4623635ae17312d9035a3ebf7d0e453; ad9736e59b=5f9fb8704e1c378e38cd14717691f85f; CT_CSRF_TOKEN=1c6af2fcf50076a288ae251b35c6a58d1e94a190b3057cfbf491b257fa7aed426ff8020391feee31c38260653b2e9b621bd28afcd14c39df5e3c4f3a5446e1f1; wms.agent=true; wms-tkp-token=20078972587-54e8ea4f-437f95d421dfa6e4e0185b9234a17ed7; 2175579276=821664cbd24f107b5b5fa1e2d7ec5333; CSRF_TOKEN=1c6af2fcf50076a288ae251b35c6a58d1e94a190b3057cfbf491b257fa7aed426ff8020391feee31c38260653b2e9b621bd28afcd14c39df5e3c4f3a5446e1f1; isiframeenabled=true; zohocares-_zldt=69d83961-ea67-48ff-829f-4d9a5ce91169-1; JSESSIONID=3435EE18BDC4815DA2945910AB39E8B4; com_chat_owner=1638885184516",
    zsrfToken:
      "zomcsparam=1c6af2fcf50076a288ae251b35c6a58d1e94a190b3057cfbf491b257fa7aed426ff8020391feee31c38260653b2e9b621bd28afcd14c39df5e3c4f3a5446e1f1",
  });

  const zoho = new Zoho(client);

  const salesOrder = await zoho.salesOrder.create({
    salesorder_number: ["TEST", randomInt(90000)].join("-"),
    customer_id: "116240000001023815",
    line_items: [
      {
        item_id: "116240000000203041",
        quantity: 5,
      },
    ],
  });
  console.log(JSON.stringify({ salesOrder }, null, 2));

  await zoho.salesOrder.setCustomFieldValue({
    customFieldName: "cf_orderhash",
    salesOrderIds: [salesOrder.salesorder_id],
    value: "bcc",
  });
  await zoho.salesOrder.setCustomFieldValue({
    customFieldName: "cf_ready_to_fulfill",
    salesOrderIds: [salesOrder.salesorder_id],
    value: "true",
  });

  const found = await zoho.salesOrder.search("TEST-");

  console.log(JSON.stringify({ found }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
