import { ZohoApiClient } from "../client/client";
import { SalesOrderHandler } from "./salesOrder";
import { ItemHandler } from "./item";
import { ContactHandler } from "./contact";
import { PackageHandler } from "./package";
import { InvoiceHandler } from "./invoice";
import { WarehouseHandler } from "./warehouse";

export class Zoho {
    public readonly salesOrder: SalesOrderHandler;

    public readonly item: ItemHandler;

    public readonly contact: ContactHandler;

    public readonly package: PackageHandler;

    public readonly invoice: InvoiceHandler;

    public readonly warehouse: WarehouseHandler;

    constructor(client: ZohoApiClient) {
        this.salesOrder = new SalesOrderHandler(client);
        this.item = new ItemHandler(client);
        this.package = new PackageHandler(client);
        this.contact = new ContactHandler(client);
        this.invoice = new InvoiceHandler(client);
        this.warehouse = new WarehouseHandler(client);
    }
}
