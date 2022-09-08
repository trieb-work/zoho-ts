# Zoho TS

A typescript / node.js library used to work with Zoho Inventory and Zoho Books API.
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
