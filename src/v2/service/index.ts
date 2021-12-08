import { ZohoApiClient } from "../client/client";
import { SalesOrderHandler } from "./salesOrder";
import { ItemHandler } from "./item";
import { ContactHandler } from "./contact";

export class Zoho {
  public readonly salesOrder: SalesOrderHandler;

  public readonly item: ItemHandler;

  public readonly contact: ContactHandler;

  constructor(client: ZohoApiClient) {
    this.salesOrder = new SalesOrderHandler(client);
    this.item = new ItemHandler(client);
    this.contact = new ContactHandler(client);
  }
}
