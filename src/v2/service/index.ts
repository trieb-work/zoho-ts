import { ZohoApiClient } from "../client/client";
import { SalesOrderHandler } from "./salesOrder";
import { ItemHandler } from "./item";

export class Zoho {
  public readonly salesOrder: SalesOrderHandler;

  public readonly item: ItemHandler;

  constructor(client: ZohoApiClient) {
    this.salesOrder = new SalesOrderHandler(client);
    this.item = new ItemHandler(client);
  }
}
