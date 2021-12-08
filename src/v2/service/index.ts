import { ZohoApiClient } from "../client/client";
import { ItemService, SalesOrderService } from "./interface";
import { SalesOrderHandler } from "./salesOrder";
import { ItemHandler } from "./item";

export class Zoho {
  public readonly salesOrder: SalesOrderService;
  public readonly item: ItemService;

  constructor(client: ZohoApiClient) {
    this.salesOrder = new SalesOrderHandler(client);
    this.item = new ItemHandler(client);
  }
}
