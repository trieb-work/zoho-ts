/**
 * Zoho gives us warehouse stock information for an item
 */
export type WarehouseStock = {
    warehouse_id: string;
    warehouse_name: string;
    status: "active" | "inactive";
    is_primary: boolean;
    warehouse_stock_on_hand: number;
    initial_stock: number;
    initial_stock_rate: number;
    warehouse_available_stock: number;
    warehouse_actual_available_stock: number;
    warehouse_committed_stock: number;
    warehouse_actual_committed_stock: number;
    warehouse_available_for_sale_stock: number;
    warehouse_actual_available_for_sale_stock: number;
    batches: [];
    is_fba_warehouse: false;
    sales_channels: [];
};

type PackageDetails = {
    dimension_unit: "cm";
    height: string;
    length: string;
    weight: number;
    weight_unit: "kg" | "g" | "lb" | "oz";
    width: string;
};

export type Item = {
    /**
     * Unique ID generated by the server for the group to which the item belongs, if any. This is used as an identifier.
     */
    group_id?: string;

    /**
     * Name of product group -> Group Name is the actual "product name". name is the variant name
     */
    group_name?: string;

    /**
     * Unit of measurement for the item. For example "Stück"
     */
    unit: string;

    /**
     * Item type can be inventory, sales, purchases or sales_and_purchases. If item is associated with a group, then type should be inventory.
     */
    item_type: string;
    /**
     * Type of the product. It can be goods or service
     */
    product_type: string;

    /**
     * Boolean to track the taxability of the item.
     */
    is_taxable: boolean;

    /**
     * Unique ID generated by the server for the tax associated with the item. This is used a unique identifier.
     */
    tax_id: string;

    /**
     * Description of the Item.
     */
    description: string;

    is_combo_product: boolean;

    /**
     * Name of the tax applied on the Item Group.
     */
    tax_name: string;

    /**
     * Percentage of the Tax
     */
    tax_percentage: number;

    brand: string;

    manufacturer: string;

    /**
     * Type of the Tax.
     */
    tax_type: string;

    /*+
     * Unique ID generated by the server for the Purchase account.
     */
    purchase_account_id: number;

    /**
     * Name of the Purchase Account
     */
    purchase_account_name: string;

    /**
     * Unique ID generated by the server for the Sales account.
     */
    account_id: number;

    /**
     * Name of the Sales Account.
     */
    account_name: string;

    /**
     * Unique ID generated by the server for the Inventory account.
     */
    inventory_account_id: number;

    /**
     * Unique ID generated by the server for the Inventory account.
     */
    attribute_id1: number;

    /**
     * Name of the attribute present in the Item Group.
     */
    attribute_name1: string;

    /**
     * Status of the Item Group.
     */
    status: "active" | "inactive";

    /**
     * The source of the Item Group.
     */
    source: string;

    /**
     * Unique ID generated by the server for the Item. This is used as an identifier.
     */
    item_id: string;

    item_name: string;

    /**
     * Name of the Item.
     */
    name: string;

    /**
     * Sales price of the Item.
     */
    rate: number;

    /**
     * Pricelist rate applied on the item.
     */
    pricebook_rate: number;

    /**
     * Purchase price of the Item.
     */
    purchase_rate: number;

    /**
     * Reorder level of the item.
     */
    reorder_level: number;

    /**
     * The opening stock of the item.
     */
    initial_stock: number;

    /**
     * The opening stock value of the item.
     */
    initial_stock_rate: number;

    /**
     * Stock based on Shipments and Receives
     */
    available_stock: number;

    /**
     * Stock based on Shipments and Receives minus ordered stock
     */
    actual_available_stock: number;

    /**
     * Unique ID generated by the server for the Vendor. This is used as an identifier.
     */
    vendor_id: number;

    /**
     * Name of the preferred Vendor for purchasing this item.
     */
    vendor_name: string;

    /**
     * Stock available for a particular item. Is undefined for services and
     * not inventory tracked products
     */
    stock_on_hand?: number;

    /**
     * The Stock Keeeping Unit (SKU) of an item. This is unique for every item in the Inventory.
     */
    sku: string;

    /**
     * The 12 digit Unique Product Code (UPC) of the item.
     */
    upc: number;

    /**
     * Unique EAN value for the Item.
     */
    ean: number;

    /**
     * Unique ISBN value for the Item.
     * */
    isbn: string;
    /**
     * Part Number of the Item.
     */
    part_number: string;

    /**
     * Unique ID generated by the server for the attribute's options. This is used as an identifier.
     */
    attribute_option_id1: number;

    /**
     * Name of the attribute's option.
     */
    attribute_option_name1: number;

    /**
     * Unique ID generated by the server for the item image. This is used as an identifier.
     */
    image_id: number;

    /**
     * Image name of the Item.
     */
    image_name: string;
    /**
     * The description for the purchase information. This will be displayed to the vendor in your purchase order.
     */
    purchase_description: string;

    package_details: PackageDetails;

    /**
     * Type of the image i.e., its file format.
     */
    image_type: string;

    created_time: string;

    last_modified_time: string;

    is_returnable: boolean;

    warehouses?: WarehouseStock[];
};

/**
 * Custom fields that always start with "cf_"
 */
type CustomFieldsDirectAPIResponse = { [key: string]: unknown };

type MappedProduct = {
    mapped_item_id: string;
    item_id: string;
    /**
     * Every mapped item can have a specific order
     */
    item_order: number;
    name: string;
    rate: number;
    rate_formatted: "€0,00";
    purchase_rate: 0.42;
    purchase_rate_formatted: "€0,42";
    sku: string;
    status: 1;
    image_name: "";
    image_document_id: "";
    purchase_description: string;
    image_type: "";
    unit: string;
    product_type: "goods";
    is_combo_product: false;
    description: "";
    quantity: number;
    stock_on_hand: number;
    stock_on_hand_formatted: "0,00";
    available_stock: number;
    available_stock_formatted: "0,00";
    actual_available_stock: number;
    actual_available_stock_formatted: "0,00";
};

export type GetItem = Item;

export type CreateItem = Pick<Item, "name"> & Item;

export type ListItem = Pick<
    Item,
    | "account_id"
    | "actual_available_stock"
    | "available_stock"
    | "brand"
    | "ean"
    | "is_combo_product"
    | "is_returnable"
    | "isbn"
    | "item_id"
    | "item_name"
    | "item_type"
    | "last_modified_time"
    | "created_time"
    | "name"
    | "manufacturer"
    | "name"
    | "product_type"
    | "purchase_account_id"
    | "purchase_rate"
    | "rate"
    | "sku"
    | "stock_on_hand"
    | "tax_id"
    | "tax_percentage"
    | "unit"
    | "status"
> &
    Partial<Pick<Item, "group_name">> &
    PackageDetails &
    CustomFieldsDirectAPIResponse;

/**
 * Zoho's ItemGroup system is actually just a different name for Product (ItemGroup) and Product Variant (Item)
 * Products in an item group share similar features. You can create multiple product variants (items) at once, using
 * the ItemGroup create
 */
export type ItemGroup = {
    group_id: string;

    /**
     * Name of the Item Group.
     */
    group_name: string;

    brand: string;

    manufacturer: string;

    /**
     * Unit of measurement of the Item Group.
     */
    unit: "box" | "kg" | "Stück" | "pcs" | "Set" | "pauschal" | string;

    /**
     * Description of the Item Group.
     */
    description: string;

    tax_id: string;

    items: Item[];

    /**
     * The variant selection attribute 1 - e.g. "sort" or "color"
     */
    attribute_name1: string;

    /**
     * The variant selection attribute 2 - e.g. "sort" or "color"
     */
    attribute_name2: string;

    attribute_name3: string;
};

export type FullCompositeItem = Omit<
    Item,
    "group_id" | "group_name" | "is_combo_product" | "item_id"
> & {
    is_combo_product: true;
    mapped_items: MappedProduct[];
    composite_component_items: MappedProduct[];
    composite_service_items: MappedProduct[];
    composite_item_id: string;
};

/**
 * When creating items directly with the "CreateItemGroup" API call, we have to set different fields mandatory and optional
 */
type CreateItemGroupItem = Required<
    Pick<Item, "name" | "rate" | "purchase_rate">
> &
    Partial<Pick<Item, "sku" | "upc" | "ean">>;

export type CreateItemGroup = Pick<ItemGroup, "group_name" | "unit"> &
    Partial<
        Pick<
            ItemGroup,
            | "brand"
            | "manufacturer"
            | "description"
            | "tax_id"
            | "attribute_name1"
            | "attribute_name2"
            | "attribute_name3"
        >
    > & {
        items: CreateItemGroupItem[];
    };
