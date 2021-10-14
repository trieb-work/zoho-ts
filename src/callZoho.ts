/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable max-classes-per-file */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosInstance, AxiosResponse } from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import { ClientCredentials, ModuleOptions, AccessToken } from "simple-oauth2";
import FormData from "form-data";
import retry from "async-retry";
import {
  ContactPerson,
  Contact,
  ContactWithFullAddresses,
  Address,
  InvoiceSettings,
  ContactSettings,
  LineItem,
  Bundle,
  SalesOrder,
  Invoice,
  Package,
  LanguageCode,
  InvoiceOptional,
  AddressOptional,
  SalesOrderReturn,
  Webhook,
  WebhookUpdate,
  CustomerPayment,
  TemplateName,
  ZohoEmailTemplate,
  invoiceStatus,
  SalesOrderWithInvoicedAmount,
  Entity,
  CustomFunction,
  WebhookSearch,
  CustomFunctionSearch,
  ContactCreate,
  CustomerPaymentCreate,
  SalesOrderSearchResponse,
  SalesOrderShortSearchOverview,
} from "./types";

dayjs.extend(isBetween);

type ZohoConfig = {
  zohoClientId: string;
  zohoClientSecret: string;
  zohoTokenHost?: string;
  zohoTokenPath?: string;
  zohoOrgId: string;
};

async function authenticate(zohoConfig: ZohoConfig) {
  // authenticate to the Zoho API
  // try to re-use existing and valid tokens

  let accessToken: AccessToken;

  const tokenConfig = {
    scope: "ZohoInventory.FullAccess.all",
  };

  if (!zohoConfig.zohoClientId)
    throw new Error(
      'No Zoho oAuth client found. Did you run the "authenticate" function?',
    );
  if (!zohoConfig.zohoClientSecret)
    throw new Error(
      'No Zoho oAuth client-secret found. Did you run the "authenticate" function?',
    );
  if (!zohoConfig.zohoOrgId)
    throw new Error(
      'No Zoho organization found. Did you run the "authenticate" function?',
    );
  if (!zohoConfig.zohoTokenHost)
    throw new Error("Zoho Token Host missing in authenticate function");

  const config: ModuleOptions = {
    client: {
      id: zohoConfig.zohoClientId,
      secret: zohoConfig.zohoClientSecret,
    },
    auth: {
      tokenHost: zohoConfig.zohoTokenHost,
      tokenPath: zohoConfig.zohoTokenPath,
    },
    options: {
      authorizationMethod: "body",
    },
  };

  const clientCredentials = new ClientCredentials(config);

  try {
    accessToken = await clientCredentials.getToken(tokenConfig);
    if (accessToken.expired(300)) {
      accessToken = await clientCredentials.getToken(tokenConfig);
    }
    return accessToken;
  } catch (error) {
    console.error("Error accessing Zoho", error);
    throw new Error(error as string);
  }
}

async function createInstance(zohoConfig: ZohoConfig) {
  const options = {
    baseURL: "https://inventory.zoho.eu/api/v1",
    timeout: 7000,
    params: { organization_id: zohoConfig.zohoOrgId },
  };

  if (process && process.env.ZOHO_COOKIES) {
    const { ZOHO_COOKIES, ZOHO_TOKEN } = process.env;
    const instanceWithCookies = axios.create({
      ...options,
      headers: {
        Cookie: ZOHO_COOKIES,
        "X-ZCSRF-TOKEN": ZOHO_TOKEN,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36",
      },
    });
    return instanceWithCookies;
  }

  const auth = await authenticate(zohoConfig);
  const { access_token, token_type } = auth.token;
  const instance = axios.create({
    ...options,
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
  });
  return instance;
}

type taxes = {
  tax_specific_type: string;
  tax_percentage_formatted: string;
  is_value_added: boolean;
  is_editable: boolean;
  tax_id: string;
  deleted: boolean;
  tax_type: string;
  tax_percentage: number;
}[];

const getPackage = async (instance: AxiosInstance, packageId: string) => {
  const result = await instance({
    url: `/packages/${packageId}`,
    headers: {
      "X-ZB-SOURCE": "zbclient",
    },
  });
  if (result.status < 200 || result.status >= 300)
    throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
  return result.data.package as Package;
};

interface ExtendedSalesorder extends SalesOrder {
  code: number;
  message: string;
}
export abstract class MultiMethods {
  protected instance!: AxiosInstance;

  protected zohoOrgId!: string;

  /**
   * Create an invoice in Zoho. Set totalGrossAmount to compare the result of the salesorder with a total Gross Amount.
   * @param rawData
   * @param totalGrossAmount
   */
  createInvoice = async (
    rawData: InvoiceOptional,
    // totalGrossAmount?: number,
    timeout = 20000,
  ) => {
    this.instance.defaults.timeout = timeout;
    const data = `JSONString=${encodeURIComponent(JSON.stringify(rawData))}`;

    const result = await this.instance({
      method: "post",
      url: "/invoices",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });

    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.invoice.invoice_number as string;
  };

  /**
   * Add an address to a contact. Do not change the default address or edit any existing documents from this customer.
   * @param contactId
   * @param address
   */
  addAddresstoContact = async (
    contactId: string,
    address: AddressOptional,
    retries = 1,
  ) => {
    const adressConstructor = { ...address };
    // we don't want to change the address at existing transactions in Zoho.
    adressConstructor.update_existing_transactions_address = "false";
    let addressId = "";
    await retry(
      async () => {
        const data = `JSONString=${encodeURIComponent(
          JSON.stringify(adressConstructor),
        )}`;
        const result = await this.instance({
          url: `/contacts/${contactId}/address`,
          method: "post",
          data,
        });
        if (result?.data?.code !== 0)
          throw new Error(`Adding the address was not successfull! ${address}`);
        addressId = result.data.address_info.address_id as string;
      },
      {
        retries,
      },
    );
    return addressId;
  };

  /**
   * This functions gets the total amount of all bundles of a specific month. Use this for example when you need to charge somebody
   * for the bundling and you need to count them per month.
   * @param from Configure the time range from parameter. Format: 2020-11-01
   * @param to Configure the time range to parameter.
   * @param userNameFilter Filter the created bundles by a specific Username
   */
  getBundles = async (from: string, to: string, userNameFilter?: string) => {
    const responseData = await this.instance({
      url: "/bundles",
      method: "get",
    });
    if (responseData.data.code !== 0)
      throw new Error(
        `Error Zoho Api: [${responseData.status}]: ${responseData.data}`,
      );
    const From = dayjs(from);
    const To = dayjs(to);
    const bundles: Bundle[] = responseData.data.bundles;
    const bundlesWithDate = bundles.filter((bundle) => {
      const parsedDate = dayjs(bundle.date);
      let user = true;
      if (userNameFilter && bundle.created_by_name !== userNameFilter)
        user = false;
      return parsedDate.isBetween(From, To) && user;
    });
    const totalBundles = bundlesWithDate.reduce(
      (previous, current) => previous + current.quantity_to_bundle,
      0,
    );
    return totalBundles;
  };

  customField = async () => {
    const result = await this.instance.get("/contacts/editpage");
    const returnValue = result.data.custom_fields.filter(
      (x: { label: string }) => x.label === "saleor-id",
    );
    if (!returnValue)
      throw new Error(
        "no Contact custom field for saleor-id found. Please create it first.",
      );
    return returnValue[0].customfield_id;
  };

  contactPersonID = async (invoiceId: string) => {
    const result = await this.instance({
      url: "/invoices/editpage",
      params: {
        invoice_id: invoiceId,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return {
      contact_person_id: result.data.contact.primary_contact_id as string,
      email: result.data.contact.email_id as string,
    };
  };

  /**
   * Search in Zoho for a package with that Tracking Number. Returns null if no match
   * Pulls full package data from Zoho in a second API-call
   * @param trackingNumber
   */
  getPackageByTrackingNumber = async (trackingNumber: string) => {
    const result = await this.instance({
      url: "/packages",
      params: {
        tracking_number_contains: trackingNumber,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.packages;
    if (returnValue.length < 1) return null;
    // we just receive a certain package subset - pulling the full package data to return it.
    const packageId = returnValue[0].package_id;
    const fullPackage = await getPackage(this.instance, packageId);
    return fullPackage;
  };

  /**
   * Get possible metadata for salesorders, like possible tax rates and the custom field ID for "ready to fulfill"
   * @returns { } the ID of the custom field "Ready to Fulfill" in Zoho. We use this to control,
   * if an order is ready to be send out.
   */
  salesOrderEditpage = async () => {
    const result = await this.instance.get("/salesorders/editpage");
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const taxes = result.data.taxes.filter(
      (x: { deleted: boolean }) => x.deleted === false,
    ) as taxes;
    const customFieldReadyToFulfill = result.data.custom_fields.find(
      (x: { placeholder: string }) => x.placeholder === "cf_ready_to_fulfill",
    )?.customfield_id as string;
    if (!customFieldReadyToFulfill)
      throw new Error(
        'Custom Field "Ready to Fulfill" for Salesorders is not created yet!! Please fix ASAP',
      );
    return { taxes, customFieldReadyToFulfill };
  };

  /**
   * Gets a customer and resolves all addresses, that this customer has attached.
   * @param contactId
   */
  getContactWithFullAdresses = async (
    contactId: string,
  ): Promise<ContactWithFullAddresses> => {
    const result = await this.instance({
      url: `/contacts/${contactId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result?.data?.contact;
    if (returnValue.language_code === "") returnValue.language_code = "de";

    const addressResult = await this.instance({
      url: `/contacts/${contactId}/address`,
    });
    if (addressResult.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return {
      ...(returnValue as Contact),
      addresses: addressResult.data.addresses as Address[],
    } as ContactWithFullAddresses;
  };

  /**
   * Get a contact / customer by its ID.
   * @param {string} contactId
   */
  getContactById = async (
    contactId: string,
  ): Promise<Contact | ContactWithFullAddresses> => {
    const result = await this.instance({
      url: `/contacts/${contactId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result?.data?.contact;
    if (returnValue.language_code === "") returnValue.language_code = "de";

    return {
      ...(returnValue as Contact),
    };
  };

  /**
   * Get invoice_items from up to 25 Individual Salesorder Ids. The corresponding invoice will have
   * these Salesorders attached to.
   * @param salesorderIds Array of Salesorder Ids
   * @param contactId Zoho Contact Id for this invoice
   */
  getInvoiceDataFromMultipleSalesOrders = async (
    salesorderIds: string[],
    contactId: string,
    isInclusiveTax: boolean,
  ) => {
    const salesorderString = salesorderIds.join(",");
    const result = await this.instance({
      url: "/invoices/include/salesorderitems",
      params: {
        salesorder_ids: salesorderString,
        is_inclusive_tax: isInclusiveTax,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const invoiceSettingsResult = await this.instance({
      url: "/invoices/editpage/fromcontacts",
      params: {
        contact_id: contactId,
      },
    });
    if (invoiceSettingsResult.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const invoiceSettings: InvoiceSettings =
      invoiceSettingsResult.data.invoice_settings;
    const contact: ContactSettings = invoiceSettingsResult.data.contact;
    let lineItems: LineItem[] = result.data.invoice_items;
    lineItems = lineItems.map((item) => {
      delete item.warehouse_name;
      delete item.warehouses;
      return item;
    });
    const referenceNumber: string = result.data.reference_number;
    return {
      line_items: lineItems,
      reference_number: referenceNumber,
      invoice_settings: invoiceSettings,
      contact,
    };
  };

  /**
   * Get a package by ID
   * @param param0
   */
  getPackage = async ({ package_id }: { package_id: string }) =>
    getPackage(this.instance, package_id);

  /**
   * Search for a customer in Zoho. Filters results for just customers! No vendors
   * @param param0
   */
  getContact = async ({
    first_name,
    last_name,
    email,
    company_name,
  }: {
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
  }) => {
    const result = await this.instance({
      url: "/customers",
      params: {
        first_name_contains: first_name,
        last_name_contains: last_name,
        email_contains: email,
        company_name_contains: company_name,
        usestate: false,
        sort_order: "A",
        status: "active",
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.contacts;
    if (returnValue.length < 1) return null;
    // zoho might give us "closely" matching email addresses, so we select the return value with the exact same email address.
    const exactMatch = returnValue.find(
      (x: { email: string }) => x.email === email,
    );
    return exactMatch?.contact_id;
  };

  createContactPerson = async (
    contactId: string,
    contactPerson: ContactPerson,
  ) => {
    if (!contactId)
      throw new Error(
        `contactId missing! Can't create the contact person ${contactPerson}`,
      );
    const createData = {
      ...contactPerson,
      contact_id: contactId,
    };
    const data = `JSONString=${encodeURIComponent(JSON.stringify(createData))}`;
    const result = await this.instance({
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      url: "/contacts/contactpersons",
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.contact_person.contact_person_id as string;
  };

  /**
   * get the total amount of packages in a specific time-range. Date format: 2020-11-02
   * @param param0
   */
  getPackagesTotal = async ({ from, to }: { from: string; to: string }) => {
    const result = await this.instance({
      url: "/packages/",
      headers: {
        "X-ZB-SOURCE": "zbclient",
      },
      params: {
        shipment_date_start: from,
        shipment_date_end: to,
        response_option: 2,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const totalAmount: number = result.data?.page_context?.total;
    return totalAmount;
  };

  /**
   * gets a salesorder by ID
   * @param salesorderId
   */
  getSalesorderById = async (salesorderId: string) => {
    const result = await this.instance({
      url: `/salesorders/${salesorderId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.salesorder as SalesOrderReturn;
  };

  /**
   * get a salesorder by salesorder number! Searches for the number first.
   * @param salesorderNumber
   */
  getSalesorder = async (salesorderNumber: String) => {
    const result = await this.instance({
      url: "/salesorders",
      params: {
        salesorder_number: salesorderNumber,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.salesorders;
    if (returnValue.length < 1) return null;

    // get the full salesorder with metadata. Search results just offer parts
    const FullResult = await this.instance({
      url: `/salesorders/${returnValue[0].salesorder_id}`,
    });
    if (FullResult.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);

    // this easy to use value is NOT set by Zoho when accessing the Salesorder directly ..
    FullResult.data.salesorder.total_invoiced_amount =
      returnValue[0].total_invoiced_amount;

    return FullResult.data.salesorder as SalesOrderWithInvoicedAmount;
  };

  /**
   * Get a list of invoices
   * @param filters
   */
  getInvoices = async ({
    date_before,
    status,
    customview_id,
  }: {
    date_before: string;
    status: invoiceStatus;
    customview_id?: string;
  }) => {
    const result = await this.instance({
      url: "/invoices",
      params: {
        date_before,
        status,
        customview_id,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);

    return result.data.invoices as Invoice[];
  };

  /**
   * gets an invoice by its Zoho Invoice ID
   * @param invoiceId
   */
  getInvoiceById = async (invoiceId: string) => {
    const result = await this.instance({
      url: `/invoices/${invoiceId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.invoice as Invoice;
  };

  /**
   * search for customer payments
   * @param The search params like cf_custom_field etc.
   */
  getCustomerPayments = async (searchParams: { [key: string]: string }) => {
    const result = await this.instance({
      url: "/customerpayments",
      params: searchParams,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.customerpayments as CustomerPayment[];
  };

  /**
   * Update specific values of a customer payment
   * @param id
   * @param rawData
   */
  updateCustomerPayment = async (
    id: string,
    rawData: CustomerPaymentCreate,
    retries = 0,
  ) => {
    if (typeof id !== "string")
      throw new Error("You are missing the Payment ID! Please set it");
    const data = `JSONString=${encodeURIComponent(JSON.stringify(rawData))}`;
    await retry(
      async () => {
        const result = await this.instance({
          method: "put",
          url: `/customerpayments/${id}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data,
        });
        if (result.status < 200 || result.status >= 300)
          throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
        return true;
      },
      {
        retries,
      },
    );
  };

  /**
   * Get a corresponding invoice from a salesorder. Fails, if this Saleosorder has no, or more than one invoices attached.
   * @param salesOrderId The Zoho ID of the Salesorder
   */
  getInvoicefromSalesorder = async (salesOrderId: string) => {
    const result = await this.instance({
      url: "/salesorders/editpage",
      params: {
        salesorder_id: salesOrderId,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.salesorder.invoices;
    if (returnValue.length < 1)
      throw new Error("This salesorder has no invoices attached.");
    if (returnValue.length > 1)
      throw new Error(
        "This salesorder has more than one invoice attached. We can't add a payment",
      );
    return {
      invoice_id: returnValue[0].invoice_id,
      metadata: returnValue[0],
    };
  };

  /**
   * Search for a product by SKU in Zoho and get the first result. Return the taxRate in percent and the Item ID
   * @param {object} param0
   * @param {string} param0.product_sku The SKU of the product to look for
   */
  getItembySKU = async ({ product_sku }: { product_sku: string }) => {
    const result = await this.instance({
      url: "/items",
      params: {
        sku: product_sku,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.items;
    if (returnValue < 1)
      console.error(
        `No product for this SKU found! Create the product first in Zoho ${product_sku}`,
      );
    return {
      zohoItemId: returnValue[0].item_id as string,
      zohoTaxRate: returnValue[0].tax_percentage as number,
      name: returnValue[0].name as string,
      zohoTaxRateId: returnValue[0].tax_id as string,
    };
  };

  deleteContact = async (contactId: string) => {
    const result = await this.instance({
      method: "DELETE",
      url: `/contacts/${contactId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return true;
  };

  /**
   * Create a contact and return the ID of the contact, the billing_address, shipping_address and contact person ID
   * @param data
   */
  createContact = async (contact: ContactCreate) => {
    const data = `JSONString=${encodeURIComponent(JSON.stringify(contact))}`;
    const result = await this.instance({
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      url: "/contacts",
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return {
      contact_id: result.data.contact.contact_id,
      contact_person_id:
        result.data.contact.contact_persons[0]?.contact_person_id,
      billing_address_id:
        result.data.contact.billing_address.address_id || null,
      shipping_address_id:
        result.data.contact.shipping_address.address_id || null,
    };
  };

  /**
   * Get the Item from Zoho using its ID
   * @param {object} param0
   * @param {string} param0.product_id The Zoho product ID like 116240000000037177
   */
  getItem = async ({ product_id }: { product_id: string }) => {
    if (!product_id) throw new Error("Missing mandatory field product ID!");
    const result = await this.instance({
      url: `/items/${product_id}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    if (!result.data.item)
      throw new Error(
        `No Product data returned from Zoho! ${JSON.stringify(result.data)}`,
      );
    return result.data.item;
  };

  /**
   * The the whole itemgroup for a product
   * @param product_id
   */
  getItemGroup = async (product_id: string) => {
    const result = await this.instance({
      url: `/itemgroups/${product_id}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    if (!result.data.item_group)
      throw new Error(
        `No Product data returned from Zoho! ${JSON.stringify(result.data)}`,
      );
    return result.data.item_group;
  };

  /**
   * Creates a salesorder in Zoho. Set totalGrossAmount to compare the result of the salesorder with a total Gross Amount.
   * @param rawData
   * @param totalGrossAmount
   */
  createSalesorder = async (
    rawData: Partial<SalesOrder>,
    totalGrossAmount?: string,
  ) => {
    const total_gross_amount = totalGrossAmount
      ? parseFloat(totalGrossAmount)
      : undefined;
    const data = `JSONString=${encodeURIComponent(JSON.stringify(rawData))}`;

    const result = await this.instance({
      method: "post",
      url: "/salesorders",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      params: {
        ignore_auto_number_generation: true,
      },
      data,
    });
    if (result.status < 200 || result.status >= 300) {
      console.error(
        "Creating the Salesorder failed in Zoho. Printing out response and the salesorder we wanted to create",
        result.data,
      );
      console.info(JSON.stringify(data, null, 2));
    }
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    if (total_gross_amount)
      if (total_gross_amount !== result.data.salesorder.total)
        throw new Error(
          `Total gross amount is wrong! ${total_gross_amount} !== ${result.data.salesorder.total}`,
        );

    return result.data.salesorder as SalesOrderReturn;
  };

  /**
   * Delete a salesorder by ID
   * @param salesorderId
   */
  deleteSalesorder = async (salesorderId: string) => {
    const result = await this.instance({
      method: "DELETE",
      url: `/salesorders/${salesorderId}`,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return true;
  };

  /**
   * Update specific values of a salesorder
   * @param id
   * @param rawData
   */
  updateSalesorder = async (id: string, rawData: SalesOrder, retries = 0) => {
    if (typeof id !== "string")
      throw new Error("You are missing the salesorderid! Please set it");
    const data = `JSONString=${encodeURIComponent(JSON.stringify(rawData))}`;
    await retry(
      async () => {
        const result = await this.instance({
          method: "put",
          url: `/salesorders/${id}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data,
        });
        if (result.status < 200 || result.status >= 300)
          throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
        return true;
      },
      {
        retries,
      },
    );
  };

  /**
   * Confirm several sales orders at once. Takes long for > 10 salesorders. Limit is 25 salesorders (I think)
   * @param salesorders Array of Salesorder Ids to confirm at once
   * @param retries the number of retries we should do when request fails
   */
  salesordersConfirm = async (salesorders: string[], retries = 3) => {
    const data = `salesorder_ids=${encodeURIComponent(salesorders.join(","))}`;
    if (salesorders.length > 25)
      throw new Error("We can only confirm 25 salesorders at once!");
    await retry(
      async () => {
        const result = await this.instance({
          method: "post",
          url: "/salesorders/status/confirmed",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data,
        });
        if (result.status < 200 || result.status >= 300)
          throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
        return true;
      },
      {
        retries,
      },
    );
  };

  salesorderConfirm = async (salesorderId: string, retries = 3) => {
    await retry(
      async () => {
        const result = await this.instance({
          method: "post",
          url: `/salesorders/${salesorderId}/status/confirmed`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        if (result.status < 200 || result.status >= 300)
          throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
      },
      {
        retries,
      },
    );
    return true;
  };

  /**
   * Takes an existing non-draft Salesorder and converts it to an invoice
   * @param {string} salesorderId Salesorder ID - the unique ID of this salesorder in Zoho
   */
  invoicefromSalesorder = async (salesorderId: string) => {
    this.instance.defaults.timeout = 15000;
    const result = await this.instance({
      url: "/invoices/fromsalesorder",
      method: "post",
      params: {
        salesorder_id: salesorderId,
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    const returnValue = result.data.invoice;
    return returnValue.invoice_id;
  };

  createPayment = async (paymentData: CustomerPaymentCreate) => {
    const data = `JSONString=${encodeURIComponent(
      JSON.stringify(paymentData),
    )}`;
    const result = await this.instance({
      url: "/customerpayments",
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return true;
  };

  /**
   * Update an invoice. Takes the full invoice_object, including the invoice_id as input parameter
   * @param invoiceID
   * @param updateData {}
   */
  updateInvoice = async (invoiceID: string, updateData: InvoiceOptional) => {
    const data = `JSONString=${encodeURIComponent(JSON.stringify(updateData))}`;
    const result = await this.instance({
      url: `/invoices/${invoiceID}`,
      method: "put",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.invoice as Invoice;
  };

  /**
   * Get the needed data from a Zoho Emailing Template used to send out Emails to a customer
   * @param entity
   * @param id
   * @param templateName
   * @param languageCode
   */
  getEmailTemplateData = async (
    entity: Entity,
    id: string,
    templateName: TemplateName,
    languageCode: LanguageCode = "de",
  ) => {
    // first get the Templates
    const templatesResult = await this.instance({
      url: "/settings/emailtemplates",
    });
    // generate the template with language code
    const templateNameWithLang = `${templateName}_${languageCode.toLowerCase()}`;
    const template = templatesResult.data?.emailtemplates.find(
      (x: { name: string }) => x.name === templateNameWithLang,
    ) as ZohoEmailTemplate;
    if (!template)
      throw new Error(
        `No template with the name ${templateNameWithLang} found!`,
      );

    // get the email data like body, subject or the email address ID.
    const response = await this.instance({
      url: `/${entity}/${id}/email`,
      params: {
        email_template_id: template.email_template_id,
      },
    });
    const emailDataResult = response.data;

    const emailData = {
      from_address: emailDataResult.data?.from_address as string,
      subject: emailDataResult.data.subject as string,
      body: emailDataResult.data.body as string,
    };
    return emailData;
  };

  /**
   * Get custom functions from the Settings Page
   */
  getCustomFunctions = async () => {
    const result = await this.instance({
      url: "/integrations/customfunctions",
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.customfunctions as CustomFunction[];
  };

  /**
   * Get all webhooks from the settings page
   */
  getWebhooks = async () => {
    const result = await this.instance({
      url: "/settings/webhooks",
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.webhooks as WebhookSearch[];
  };

  /**
   * Send out an E-Mail by searching for the corresponding Email Template first
   * @param entity
   * @param id
   * @param templateName
   * @param userEmail the Email Address where to send to
   * @param languageCode The user language. The function tries to find an email template with _de or _en as suffix
   */
  sendEmailWithTemplate = async (
    entity: Entity,
    id: string,
    templateName: TemplateName,
    userEmail: string,
    languageCode: LanguageCode = "de",
  ) => {
    // first get the Templates
    const templatesResult = await this.instance({
      url: "/settings/emailtemplates",
    });
    // generate the template with language code
    const templateNameWithLang = `${templateName}_${languageCode.toLowerCase()}`;
    const template = templatesResult.data?.emailtemplates.find(
      (x: { name: string }) => x.name === templateNameWithLang,
    ) as ZohoEmailTemplate;
    if (!template)
      throw new Error(
        `No template with the name ${templateNameWithLang} found!`,
      );

    // get the email data like body, subject or the email address ID.
    const response = await this.instance({
      url: `/${entity}/${id}/email`,
      params: {
        email_template_id: template.email_template_id,
      },
    });
    const emailDataResult = response.data;

    const emailData = {
      from_address: emailDataResult.data?.from_address,
      to_mail_ids: [`${userEmail}`],
      subject: emailDataResult.data.subject,
      body: emailDataResult.data.body,
    };

    const form = new FormData();
    form.append("file_name", emailDataResult.data?.file_name);
    form.append("JSONString", JSON.stringify(emailData));
    form.append("attach_pdf", "true");
    // send out the email with the data from the step before
    const emailSendResult = await this.instance({
      url: `/${entity}/${id}/email`,
      headers: form.getHeaders(),
      method: "post",
      data: form,
    });
    if (emailSendResult.status < 200 || emailSendResult.status >= 300)
      throw new Error(
        `Error Zoho Api: [${emailSendResult.status}]: ${emailSendResult.data}`,
      );
    return true;
  };

  // sendInvoice = async (data) => {
  //   const result = await this.instance({
  //     url: `/invoices/${data.invoices[0].invoice_id}/email`,
  //     method: "post",
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded",
  //     },
  //     data: `JSONString=${encodeURIComponent(
  //       JSON.stringify({
  //         send_from_org_email_id: true,
  //         to_mail_ids: [data.email],
  //       }),
  //     )}`,
  //   });
  //   if (result.status < 200 || result.status >= 300) throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`)
  // };

  /**
   * Get a public download-link with 90 days validity to directly download an invoice
   * @param {string} invoiceId The invoice ID we should create the download link for
   */
  getPublicInvoiceDownloadURL = async ({
    invoiceId,
    invoiceURL,
  }: {
    invoiceId?: string;
    invoiceURL?: string;
  }) => {
    const expiry_time = dayjs().add(90, "day").format("YYYY-MM-DD");
    let returnValue;
    if (invoiceId) {
      const result = await this.instance({
        params: {
          transaction_id: invoiceId,
          transaction_type: "invoice",
          link_type: "public",
          expiry_time,
        },
      });
      if (result.status < 200 || result.status >= 300)
        throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
      returnValue = replace(result.data.share_link);
    } else {
      if (!invoiceURL)
        throw new Error("Neither invoiceId, nor Invoice URL given! Failing..");
      returnValue = replace(invoiceURL);
    }

    /**
     * Dangerously changing the URL link to be a direct download link. Zoho might change that in the future....
     * @param input
     */
    function replace(input: string) {
      return `${
        input
          .replace(/\/inventory/, "/books")
          .replace(/\/secure/, "/api/v3/clientinvoices/secure")
          .trim() as string
      }&accept=pdf`;
    }

    return returnValue;
  };

  /**
   * Downloads a PDF package slip for a package and returns it as base64 string for further processing (like printing). Retries
   * when a document doesn't seem to exist
   * @param entity
   * @param id
   * @param additions add a string of additions to the download URL (like /image etc.)
   */
  getDocumentBase64StringOrBuffer = async (
    entity: Entity,
    id: string,
    additions?: string,
  ) => {
    const url = `/${entity}/${id}${additions || ""}`;

    try {
      const retryResult = await retry(
        async () => {
          const result = await this.instance({
            url,
            params: {
              accept: "pdf",
            },
            responseType: "arraybuffer",
          });
          return result;
        },
        {
          retries: 3,
        },
      );

      const rawBuffer = Buffer.from(retryResult.data, "binary");
      const base64Buffer = Buffer.from(retryResult.data, "binary").toString(
        "base64",
      );
      const headerLine = retryResult.headers["content-disposition"];
      const startFileNameIndex = headerLine.indexOf('"') + 1;
      const endFileNameIndex = headerLine.lastIndexOf('"');
      const filename = headerLine.substring(
        startFileNameIndex,
        endFileNameIndex,
      ) as string;

      return { base64Buffer, filename, rawBuffer };
    } catch (error) {
      console.error("Document still doesn't exist!");
      return { base64Buffer: null, filename: null, rawBuffer: null };
    }
  };

  /**
   * Adds a comment to an entity
   * @param entity
   * @param id
   * @param comment the comment string
   */
  addComment = async (entity: Entity, id: string, comment: string) => {
    const data = `JSONString=${encodeURIComponent(
      JSON.stringify({ description: comment }),
    )}`;

    const result = await this.instance({
      url: `/${entity}/${id}/comments`,
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return true;
  };

  /**
   * Adds a note to a shipment
   * @param entity
   * @param id
   * @param comment the comment string
   */
  addNote = async (shipmentid: string, note: string) => {
    const data = `shipment_notes=${encodeURIComponent(note)}`;

    const result = await this.instance({
      url: `/shipmentorders/${shipmentid}/notes`,
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return true;
  };

  /**
   * Set a custom field checkbox to true or false
   * @param entity {entity}
   * @param id
   * @param customFieldId
   * @param value
   */
  setCheckboxValue = async (
    entity: Entity,
    id: string,
    customFieldId: string,
    value: boolean,
  ) => {
    const updateValue = {
      custom_fields: [
        {
          customfield_id: customFieldId,
          value,
        },
      ],
    };
    const data = `JSONString=${encodeURIComponent(
      JSON.stringify(updateValue),
    )}`;
    await this.instance({
      method: "put",
      url: `/${entity}/${id}`,
      data,
    });
    return true;
  };

  /**
   * returns a base 64 string and a filename for documents attached to a Salesorder
   * @param salesorderId
   * @param documentId
   */
  getDocumentFromSalesorderBase64String = async (
    salesorderId: string,
    documentId: string,
  ) => {
    const result = await this.instance({
      url: `/salesorders/${salesorderId}/documents/${documentId}`,
      params: {
        accept: "pdf",
      },
      responseType: "arraybuffer",
    });
    const base64Buffer = Buffer.from(result.data, "binary").toString("base64");
    const headerLine = result.headers["content-disposition"];
    const startFileNameIndex = headerLine.indexOf('"') + 1;
    const endFileNameIndex = headerLine.lastIndexOf('"');
    const filename = headerLine.substring(startFileNameIndex, endFileNameIndex);

    return { base64Buffer, filename };
  };

  /**
   * This function can be used to create a Webhook in the system.
   * @param creationData
   */
  createWebhook = async (creationData: WebhookUpdate) => {
    const data = `JSONString=${encodeURIComponent(
      JSON.stringify(creationData),
    )}`;
    const result = await this.instance({
      method: "POST",
      url: "/settings/webhooks/",
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.webhook as Webhook;
  };

  /**
   * This function can be used to update a Webhook in the system.
   * @param webhookId
   * @param updateDate
   */
  updateWebhook = async (webhookId: string, updateDate: WebhookUpdate) => {
    const data = `JSONString=${encodeURIComponent(JSON.stringify(updateDate))}`;
    const result = await this.instance({
      method: "PUT",
      url: `/settings/webhooks/${webhookId}`,
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.webhook as Webhook;
  };

  /**
   * This function can be used to create a Custom Function in the system.
   * @param creationData
   */
  createCustomfunction = async (creationData: any) => {
    const data = `JSONString=${encodeURIComponent(
      JSON.stringify(creationData),
    ).replace(/\s/g, "+")}&organization_id=${this.zohoOrgId}`;
    // form.append('organization_id', this.zohoOrgId);
    delete this.instance.defaults.params.organization_id;
    const result = await this.instance({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "X-ZB-SOURCE": "zbclient",
      },
      url: "/integrations/customfunctions",
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.customfunction as CustomFunctionSearch;
  };

  updateCustomFunction = async (customfunctionId: string, updateDate: any) => {
    const data = `JSONString=${encodeURIComponent(updateDate)}`;
    const result = await this.instance({
      method: "PUT",
      url: `/integrations/customfunctions/${customfunctionId}`,
      data,
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    return result.data.webhook as CustomFunctionSearch;
  };

  /**
   * Search for salesorders with a string and returns all matching results.
   * Uses scrolling to get 200+ results with as little API-requests as possible
   * @param searchString
   */
  searchSalesOrdersWithScrolling = async (searchString: string) => {
    const search = async (
      page = 1,
    ): Promise<SalesOrderShortSearchOverview[]> => {
      const searchResult = await this.instance({
        url: "/salesorders",
        params: {
          salesorder_number_contains: searchString,
          per_page: 200,
          page,
        },
      });
      if (searchResult.status < 200 || searchResult.status >= 300)
        throw new Error(
          `Error Zoho Api: [${searchResult.status}]: ${searchResult.data}`,
        );
      const data = searchResult.data as SalesOrderSearchResponse;
      if (searchResult.data.page_context.has_more_page) {
        return data.salesorders.concat(await search(page + 1));
      }
      return data.salesorders;
    };

    return search();
  };

  /**
   * Update custom fields of many salesorders at once with a single API call.
   * @param salesOrderIds
   * @param customFieldId
   * @param value
   */
  bulkUpdateSalesOrderCustomField = async (
    salesOrderIds: string[],
    customFieldId: string,
    value: any,
  ) => {
    const salesOrderIDs = salesOrderIds.join(",");
    const customField = { customfield_id: customFieldId, value };
    const updateData = {
      custom_fields: [customField],
      salesorder_id: salesOrderIDs,
    };
    const data = `bulk_update=true&JSONString=${encodeURIComponent(
      JSON.stringify(updateData),
    )}`;

    interface UpdateResponseObject {
      salesorders: ExtendedSalesorder[];
    }

    const result: AxiosResponse<UpdateResponseObject> = await this.instance({
      method: "PUT",
      url: "/salesorders",
      data,
    });

    result.data.salesorders.map((x) => {
      if (x.code !== 0)
        throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
      return true;
    });

    return result.data.salesorders;
  };

  /**
   * Delete multiple salesorders at once. Insert an array of salesorder Ids.
   * @param salesOrderIds
   * @returns true
   */
  bulkDeleteSalesOrders = async (salesOrderIds: string[]) => {
    const result = await this.instance({
      method: "DELETE",
      url: "/salesorders",
      params: {
        salesorder_ids: salesOrderIds.join(","),
      },
    });
    if (result.status < 200 || result.status >= 300)
      throw new Error(`Error Zoho Api: [${result.status}]: ${result.data}`);
    if (result.data.data.length > 0)
      throw new Error(
        `Not all salesorders could be deleted: ${JSON.stringify(
          result.data.data,
        )}`,
      );
    return true;
  };
}

export class ZohoClientInstance extends MultiMethods {
  private zohoClientId: string;

  private zohoClientSecret: string;

  private zohoTokenHost: string;

  private zohoTokenPath?: string;

  constructor(config: ZohoConfig) {
    super();
    this.zohoClientId = config.zohoClientId;
    this.zohoClientSecret = config.zohoClientSecret;
    this.zohoTokenHost = config.zohoTokenHost || "https://accounts.zoho.eu";
    this.zohoTokenPath = config.zohoTokenPath || "/oauth/v2/token";
    this.zohoOrgId = config.zohoOrgId;
    if (!config.zohoClientId) throw new Error("Zoho Client ID missing!");
  }

  /**
   * Needs to be called before any other function. Gets an Access Token or validates existing ones.
   */
  authenticate = async () => {
    this.instance = await createInstance({
      zohoClientId: this.zohoClientId,
      zohoClientSecret: this.zohoClientSecret,
      zohoOrgId: this.zohoOrgId,
      zohoTokenHost: this.zohoTokenHost,
      zohoTokenPath: this.zohoTokenPath,
    });
  };
}
