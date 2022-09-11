import { ZohoApiClient } from "../client/client";
import { SalesOrderHandler } from "./salesOrder";
import { ItemHandler } from "./item";
import { ContactHandler } from "./contact";
import { PackageHandler } from "./package";
import { InvoiceHandler } from "./invoice";
import { WarehouseHandler } from "./warehouse";
import { PaymentHandler } from "./payment";
import { Utils } from "./util";
import { TaxHandler } from "./tax";
import { ContactPersonHandler } from "./contactperson";
import { OrganizationHandler } from "./organizations";
import { BankAccountHandler } from "./bankaccount";
export class Zoho {
    public readonly salesOrder: SalesOrderHandler;

    public readonly item: ItemHandler;

    public readonly contact: ContactHandler;

    public readonly package: PackageHandler;

    public readonly invoice: InvoiceHandler;

    public readonly warehouse: WarehouseHandler;

    public readonly payment: PaymentHandler;

    public readonly util: Utils;

    public readonly tax: TaxHandler;

    public readonly contactperson: ContactPersonHandler;

    public readonly organization: OrganizationHandler;

    public readonly bankaccount: BankAccountHandler;

    constructor(client: ZohoApiClient) {
        this.salesOrder = new SalesOrderHandler(client);
        this.item = new ItemHandler(client);
        this.package = new PackageHandler(client);
        this.contact = new ContactHandler(client);
        this.invoice = new InvoiceHandler(client);
        this.warehouse = new WarehouseHandler(client);
        this.payment = new PaymentHandler(client);
        this.util = new Utils();
        this.tax = new TaxHandler(client);
        this.contactperson = new ContactPersonHandler(client);
        this.organization = new OrganizationHandler(client);
        this.bankaccount = new BankAccountHandler(client);
    }
}
