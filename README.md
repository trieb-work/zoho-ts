# Zoho Inventory TS

A typescript library used to work with Zoho Inventory and Zoho Books API.
There are several functions already created, but in the end they are all custom. Some of them are documented and some are reverse-engineered and implemented in this library to have an optimised, easy way working with the Zoho APIs.

All entities are fully typed.

## Usage on server

```
import { Zoho, ZohoApiClient } from "@trieb.work/zoho-ts";

const zoho = new Zoho(
    await ZohoApiClient.fromOAuth({
      orgId: "243546",
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
