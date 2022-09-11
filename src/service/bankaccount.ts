import { ListBankaccount } from "../types/bankaccount";
import { ZohoApiClient } from "../client/client";

export class BankAccountHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async list() {
        const res = await this.client.get<{ bankaccounts: ListBankaccount[] }>({
            path: ["bankaccounts"],
            apiType: "books",
        });
        return res.bankaccounts;
    }
}
