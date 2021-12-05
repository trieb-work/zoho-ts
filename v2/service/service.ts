import { ZohoApiClient } from "../client/client";
import { SalesOrder, CreateSalesOrder } from "../types/salesOrder";
export class Zoho {
  private client: ZohoApiClient;

  constructor(client: ZohoApiClient){
    this.client = client
  }

  public async createSalesOrder(order: CreateSalesOrder): Promise<SalesOrder> {
    const res = await this.client.post<{ salesorder: SalesOrder }>({
      path: ["salesorders"],
      body: order,
    })

    return res.salesorder

  }
}
