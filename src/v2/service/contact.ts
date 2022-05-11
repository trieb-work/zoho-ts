import { Contact, CreateContact } from "../types/contact";
import { ZohoApiClient } from "../client/client";
import { CreateAddress } from "../types/address";
export class ContactHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    public async create(contact: CreateContact): Promise<Contact> {
        const res = await this.client.post<{ contact: Contact }>({
            path: ["contacts"],
            body: contact,
        });

        return res.contact;
    }

    public async get(id: string): Promise<Contact | null> {
        const res = await this.client.get<{ contact?: Contact }>({
            path: ["contacts", id],
        });
        return res.contact ?? null;
    }

    public async delete(id: string): Promise<void> {
        await this.client.delete({
            path: ["contacts", id],
        });
    }

    /**
     *
     * @returns The address Id
     */
    public async addAddress(
        id: string,
        address: CreateAddress,
    ): Promise<string> {
        const res = await this.client.post<{
            address_info: { address_id: string };
        }>({
            path: ["contacts", id, "address"],
            body: {
                update_existing_transactions_address: false,
                ...address,
            },
        });

        return res.address_info.address_id;
    }
}
