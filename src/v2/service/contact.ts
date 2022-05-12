import { Contact, CreateContact } from "../types/contact";
import { ZohoApiClient } from "../client/client";
import { CreateAddress } from "../types/address";
export class ContactHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    /**
     * Create a new contact. User the contact_person array to add first name and last name to the contact
     * @param contact
     * @returns
     */
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

    /**
     * Delete one ore more contacts
     * @param ids
     * @returns
     */
    public async delete(ids: string[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        if (ids.length === 1) {
            await this.client.delete({
                path: ["contacts", ids[0]],
            });
            return;
        }

        await this.client.delete({
            path: ["contacts"],
            params: {
                contact_ids: ids.join(","),
            },
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
