import { Address, CustomField } from ".";
import { CreateAddress } from "./address";
import { ContactPersonFromContactGet } from "./contactPerson";

export type Contact = {
    /**
     * Unique id for this contact.
     */
    contact_id: string;

    /**
     * Name of the contact. This can be the name of an organisation or the name of an individual. Maximum length [200]
     */
    contact_name: string;

    /**
     * Name of the conact's company. Maximum length [200]
     */
    company_name: string;

    /**
     * First name of the contact. Maximum length [100]
     */
    first_name: string;

    /**
     * Last name of the contact. Maximum length [100]
     */
    last_name: string;

    /**
     * Search contacts by email id of the contact person. Variants: address_startswith and address_contains
     */
    email: string;

    /**
     * Contact persons related to this contact. Use this to update the first and last name of the "main" contact person of a contact
     */
    contact_persons: Partial<{
        salutation: string;
        first_name: string;
        last_name: string;
        email: string;
        is_primary_contact: boolean;
    }>[];

    /**
     * Search contacts by phone number of the contact person. Variants: phone_startswith and phone_contains
     */
    phone: string;

    /**
     * Facebook profile account of the contact. Maximum length [100]
     */
    facebook: string;

    /**
     * Twitter account of the contact. MAximum length [100]
     */
    twitter: string;

    /**
     * language of a contact
     */
    language_code:
        | "de"
        | "en"
        | "es"
        | "fr"
        | "it"
        | "ja"
        | "nl"
        | "pt"
        | "sv"
        | "zh";

    /**
     * Billing address of the contact.
     */
    billing_address: Address;

    /**
     * Customer's shipping address to which the goods must be delivered.
     */
    shipping_address: Address;

    /**
     * Location of the contact. (This node identifies the place of supply
     * and source of supply when invoices/bills are raised for the
     * customer/vendor respectively. This is not applicable for Overseas contacts)
     * India Edition only.
     */
    place_of_contact: string;

    /**
     * Name of the Tax Authority
     */
    tax_authority_name: string;

    /**
     * Enter tax exemption code
     * US, Canada, Australia and India editions only
     */
    tax_exemption_code: string;

    /**
     * Addresses related to this contact. Not the main billing and shipping address -
     * get thos with billing_address and shipping_address
     */
    addresses: Address[] | [];

    /**
     * Customer or vendor / this is Zoho specific, as contacts can be vendors or customer
     */
    contact_type: "customer" | "vendor";

    /**
     * Is this contact a business or an individual person
     */
    customer_sub_type: "business" | "individual";

    /**
     * Contact can be disabled, for example when merged with
     * a different contact
     */
    status: "active" | "inactive";

    last_modified_time: string;

    created_time: string;
};

export type CreateContact =
    /**
     * Required fields
     */
    Omit<
        Pick<Contact, "contact_name" | "customer_sub_type"> &
            /**
             * Optional fields
             */
            Partial<
                Omit<
                    Contact,
                    | "created_time"
                    | "last_modified_time"
                    | "billing_address"
                    | "shipping_address"
                >
            >,
        | "first_name"
        | "last_name"
        | "email"
        | "billing_address"
        | "shipping_address"
    > & {
        billing_address?: CreateAddress;
        shipping_address?: CreateAddress;
        custom_fields?: CustomField[];
    };

export type UpdateContact =
    /**
     * Required fields
     */
    Pick<Contact, "contact_id"> &
        /**
         * Optional fields
         */
        Partial<Pick<Contact, "company_name">> & {
            custom_fields?: CustomField[];
        };

export interface GetContact extends Contact {
    contact_persons: ContactPersonFromContactGet[];
}
