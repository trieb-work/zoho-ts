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
Make sure to select the correct datacenter for your API client credentials: e.g. ".com" or ".eu"

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
|bankaccount||
|contact||
|contactperson||
|invoice||
|item||
|organizations||
|package||
|payment||
|salesorder||
|tax||
|warehouse||
