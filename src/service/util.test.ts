import { Zoho } from "."
import { ZohoApiClient } from "../client/client"

test("String replace should work", () => {
    
    const client = undefined as unknown as ZohoApiClient
    const zoho = new Zoho(client)

    expect(zoho.util.getUnprefixedNumber("STORE-224")).toBe("224")
    expect(zoho.util.getUnprefixedNumber("BULK-224-55")).toBe("224-55")

})