import { Contact, CreateContact, GetContact } from "../types/contact";
import { ZohoApiClient } from "../client/client";
import { CreateAddress } from "../types/address";
import { sleep } from "../util/retry";
import { ContactPersonWithoutContact } from "../types/contactPerson";
/**
 * Handling all methods related to the Zoho Contact Entity
 */
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
        const res = await this.client.get<{ contact?: GetContact }>({
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
     * Add an address to a contact
     * @param contactId the contact ID that this address is related to
     * @param address the address as Zoho Address Object
     * @returns
     */
    public async addAddress(
        contactId: string,
        address: CreateAddress,
    ): Promise<string> {
        const res = await this.client.post<{
            address_info: { address_id: string };
        }>({
            path: ["contacts", contactId, "address"],
            body: {
                update_existing_transactions_address: false,
                ...address,
            },
        });

        return res.address_info.address_id;
    }

    /**
     * List contact using different filters and sort Orders. Default Limit is 200, resulting in 1 API calls - using pagination automatically.
     * Limit the total result using the fields "createdDateStart" (GTE) or "createdDateEnd" (LTE)
     * Contacts can be vendors or customers.
     * @param opts
     * @returns
     */
    public async list(opts: {
        sortColumn?: "created_time" | "last_modified_time";
        sortOrder?: "ascending" | "descending";
        limit?: number;
        /**
         * Filter by only active contacts
         */
        filterBy?: "active" | "inactive";
        /**
         * Filter contacts by either customer or vendor
         */
        contactType?: "customer" | "vendor";
    }): Promise<Contact[]> {
        const contacts: Contact[] = [];
        let hasMorePages = true;
        let page = 1;

        while (hasMorePages) {
            const res = await this.client.get<{ contacts: Contact[] }>({
                path: ["contacts"],
                params: {
                    sort_column: opts.sortColumn ?? "created_time",
                    sort_order: opts.sortOrder === "ascending" ? "A" : "D",
                    per_page: "200",
                    page,
                    status: opts.filterBy || "",
                    contact_type: opts.contactType || "",
                },
            });

            contacts.push(...res.contacts);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;
        }

        return contacts;
    }

    /**
     * Get a list of all contact persons of this contact
     * @param contactId
     * @returns
     */
    public async listContactPersons(contactId: string) {
        let hasMorePages = true;
        let page = 1;
        const contactPersons: ContactPersonWithoutContact[] = [];

        while (hasMorePages) {
            const res = await this.client.get<{
                contact_persons: ContactPersonWithoutContact[];
            }>({
                path: ["contacts", contactId, "contactpersons"],
                params: {
                    page,
                },
            });

            contactPersons.push(...res.contact_persons);
            if (!res.page_context) continue;
            hasMorePages = res.page_context?.has_more_page ?? false;
            page = res.page_context.page + 1 ?? 0 + 1;

            /**
             * Sleep to not get blocked by Zoho
             */
            if (hasMorePages) await sleep(1000);
        }

        return contactPersons;
    }
}
