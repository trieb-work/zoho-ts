export type CustomField = {
  custom_field_id?: string;
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
};
