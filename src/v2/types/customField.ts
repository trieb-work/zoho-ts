export type CustomField = {
    customfield_id?: string;

    /**
     * Seems to be always the same than customfield_id
     */
    field_id?: string;

    /**
     * Index of the custom field
     */
    index?: unknown; //TODO: Figure out type

    /**
     * Label of the Custom Field
     */
    label?: string;

    /**
     * Value of the Custom Field
     */
    value?: string | number | boolean;

    /**
     * Optionally reference this field by its api name
     * The API name can be found in the Zoho settings page when creating
     * a new custom field. It is way more comfortable using this field
     */
    api_name?: string;

    show_in_portal?: boolean;
};
