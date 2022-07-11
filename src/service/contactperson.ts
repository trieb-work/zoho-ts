import { ZohoApiClient } from "../client/client";
import { ContactPerson } from "src/types";
import { CreateContactPerson } from "src/types/contactPerson";
import { sleep } from "../util/retry";

// interface IContactPersonHandler {
//     list(contactId: string): Promise<Omit<ContactPerson, "contact_id">[]>;
//     list(): Promise<ContactPerson[]>;
// }
/**
 * Handling all methods related to the Zoho Contact Entity
 */
export class ContactPersonHandler {
    private client: ZohoApiClient;

    constructor(client: ZohoApiClient) {
        this.client = client;
    }

    /**
     * Add a contact person to a contact
     * @param contactPerson
     * @returns
     */
    public async create(
        contactPerson: CreateContactPerson,
    ): Promise<ContactPerson> {
        const res = await this.client.post<{ contact_person: ContactPerson }>({
            path: ["contacts", "contactpersons"],
            body: contactPerson,
        });

        return res.contact_person;
    }

    /**
     * Get a specific contact person
     * @param contactId
     * @param contactPersonId
     * @returns
     */
    public async get(
        contactId: string,
        contactPersonId: string,
    ): Promise<ContactPerson | null> {
        const res = await this.client.get<{ contact_person?: ContactPerson }>({
            path: ["contacts", contactId, "contactpersons", contactPersonId],
        });
        return res.contact_person ?? null;
    }

    /**
     * Delete a contact person
     * @param contactId
     * @param contactPersonId
     * @returns
     */
    public async delete(contactPersonId: string): Promise<void> {
        await this.client.delete({
            path: ["contacts", "contactpersons", contactPersonId],
        });
        return;
    }

    /**
     * List all contact persons
     * @returns
     */
    public async list(): Promise<ContactPerson[]> {
        let hasMorePages = true;
        let page = 1;
        const contactPersons: ContactPerson[] = [];

        while (hasMorePages) {
            const res = await this.client.get<{
                contact_persons: ContactPerson[];
            }>({
                path: ["contacts", "contactpersons"],
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
            await sleep(1000);
        }

        return contactPersons;
    }
}
