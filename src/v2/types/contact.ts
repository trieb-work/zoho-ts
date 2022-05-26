import { Address } from ".";

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
     * 15 digit GST identification number of the customer/vendor.
     * India Edition only.
     */
    gst_no: string;
    /**
     *  Choose whether the contact is GST registered/unregistered/consumer/overseas. Allowed values are business_gst , business_none , overseas , consumer .
     * India Edition only.
     */
    gst_treatment: string;

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
     * Not documented
     */
    addresses: Address[];

    /**
     * Customer or vendor / this is Zoho specific, as contacts can be vendors or customer
     */
    contact_type: "customer";

    /**
     * Is this contact a business or an individual person
     */
    customer_sub_type: "business" | "individual";
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
            Partial<Contact>,
        "first_name" | "last_name" | "email"
    >;

export type UpdateContact =
    /**
     * Required fields
     */
    Pick<Contact, "contact_name"> &
        /**
         * Optional fields
         */
        Partial<Pick<Contact, "company_name">>;
