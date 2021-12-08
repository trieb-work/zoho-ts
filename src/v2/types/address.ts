export type Address = {
  /**
   * Unique id for this address
   */
  address_id: string;

  /**
   * Intended recipient at given address
   */
  attention: string;

  /**
   * Name of the street of the customer’s shipping address.
   */
  address: string;

  /**
   * Name of the city of the customer’s shipping address.
   */
  city: string;

  /**
   * Name of the state of the customer's shipping address.
   */
  state: string;

  /**
   * Zip code of the customer’s shipping address.
   */
  zip: number;

  /**
   * Name of the country of the customer’s shipping address.
   */
  country: string;

  /**
   * Fax number of the customer’s shipping address.
   */
  fax: string;

  /**
   * Additional Street address of the contact. Maximum length allowed [255]
   */
  street2: string;
};

export type CreateAddress = Partial<Omit<Address, "address_id">> & {
  update_existing_transactions_address?: boolean;
};
