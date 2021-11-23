import { ZohoApiClient } from "../client/client";
import { CreateSalesOrder } from "./salesOrders/create";
export class Zoho {
  private client: ZohoApiClient;

  public async createSalesOrder(order: CreateSalesOrder): Promise<void> {}
}
