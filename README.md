# Zoho Inventory TS

A typescript library used to work with Zoho Inventory and Zoho Books API.
There are several functions already created, but in the end they are all custom. Some of them are documented and some are reverse-engineered and implemented in this library to have an optimised, easy way working with the Zoho APIs.

## Usage on server

```
import { ZohoClientInstance } from '@trieb.work/zoho-ts';


const zohoClient = new ZohoClientInstance({
            zohoClientId: '',
            zohoClientSecret: '',
            zohoOrgId: '',
        });

await zohoClient.authenticate();
```

## Usage in Browser Context (use cookies for auth)

```
import { ZohoBrowserInstance } from '@trieb.work/zoho-ts';

const zohoClient = new ZohoBrowserInstance({
    zohoOrgId: ''
});
```
