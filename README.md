# Zoho Inventory TS
A typescript library used to work with Zoho Inventory and Zoho Books API.
There are several functions already created, but in the end they are all custom. Some of them are documented and some are reverse-engineered and implemented in this library.

## Usage
```
import { ZohoClientInstance } from '@trieb.work/zoho-ts';


const zohoClient = new ZohoClientInstance({
            zohoClientId: '',
            zohoClientSecret: '',
            zohoOrgId: '',
        });
```