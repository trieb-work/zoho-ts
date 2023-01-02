# Zoho TS

A typescript / node.js library used to work with Zoho Finance Suite APIs:  Zoho Inventory, Zoho Books and Zoho Invoice.
These APIs are for most entities the same, apart from some specific functions.  
There are several functions already created, but in the end they are all custom. Some of them are documented and some are reverse-engineered and implemented in this library to have an optimised, easy way working with the Zoho APIs.

All entities are fully typed.


## Installation
```
yarn add @trieb.work/zoho-ts
```
```
npm i @trieb.work/zoho-ts
```

## Usage on server
Make sure to select the correct datacenter for your API client credentials: e.g. ".com" or ".eu".
You can also select, which API endpoint to use - Zoho Books, Zoho Invoice or Zoho Inventory. Most API endpoints are the same
and work the same. You just need to select the product, that you have licensed. 


```
import { Zoho, ZohoApiClient } from "@trieb.work/zoho-ts";

const zoho = new Zoho(
    await ZohoApiClient.fromOAuth({
      orgId: "243546",
      dc: ".com",
      apiFlavour: "invoice",
      scope: "ZohoInvoice.fullaccess.all"
      client: {
        id: "",
        secret: "",
      },
    }),
  );

```

You can decide, which API to use - Zoho Inventory, Zoho Books, Zoho Invoice. Currently, you can only decide per instance. It is planned 
to make it possible to decide which API to use on function level.

### Authentication
The library on the server should be used with a client ID and a client secret, that you can register at the developer console: https://api-console.zoho.eu/ (Self Client)


## Usage in Browser Context (use cookies for auth)

```
import { Zoho, ZohoApiClient } from "@trieb.work/zoho-ts";

const zoho = new Zoho(
    await ZohoApiClient.fromCookies({ 
        orgId: "",
        cookie: "",
        zsrfToken: ""
    }),
  );

```

## Implemented entities
|Entity|Functions|
|---|---|
|bankaccount|`list`|
|contact|`create`, `get`, `delete`, `list`, `addAddress`,`updateAddress`, `listContactPersons`|
|contactperson|`create`, `get`, `delete`, `list`|
|invoice|`create`, `get`, `delete`, `list`, `createFromSalesOrder`, `sent`|
|item|`create`, `get`, `delete`, `list`, `createGroup`, `deleteGroup`, `getComposite`|
|organizations|`list`|
|package|`create`, `get`, `delete`, `list`,`bulkCreateQuickShipment`, `createShipment`, `markDelivered`, `deleteShipmentOrder`|
|payment|`create`, `get`, `delete`, `list`|
|salesorder|`create`, `get`, `delete`, `list`, `update`, `confirm`, `markVoid`, `setCustomFieldValue`, `search`|
|tax|`list`|
|warehouse|`get`, `list`|

Usage example:
```
import { Zoho, ZohoApiClient } from "@trieb.work/zoho-ts";

const zoho = new Zoho(
    await ZohoApiClient.fromOAuth({
      orgId: "243546",
      dc: ".com",
      client: {
        id: "",
        secret: "",
      },
    }),
  );

/// Get all payments that were modified in the last hour
const payments = await zoho.payment.list({
    lastModifiedTime: subHours(new Date(), 1),
})  
```

## Error Handling
The library includes a custom error type, that you can use to handle the from Zoho returned error type:
```
try {
  
  await zoho.invoice.createFromSalesOrder(id)

} catch(err) {
  if ((err as ZohoApiError).code === 36026) {
    console.warn(
      "Aborting sync of this invoice since it was already created. Original Error: " +
        err.message,
    );
  } else {
    console.error(err.message);
  }
}

```          

