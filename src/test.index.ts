import dotenv from 'dotenv';
import { ZohoClientInstance } from './index';

dotenv.config({ path: '../../.env' });

async function main() {
    const client = new ZohoClientInstance({
        zohoClientId: process.env.ZOHO_CLIENT_ID,
        zohoClientSecret: process.env.ZOHO_CLIENT_SECRET,
        zohoOrgId: process.env.ZOHO_ORGANIZATION_ID,
    });

    try {
        await client.authenticate();
        console.log(await client.salesOrderEditpage());
        const id = await client.getContact({
            first_name: 'Jannik',
            last_name: 'Zinkl',
            email: 'zinkljannik@gmail.com',
            company_name: '',
        });
        console.log('id', id);

        console.log(await client.getPackagesTotal({ from: '2021-01-01', to: '2021-02-01' }));
        console.log(await client.getContactById(id));
        console.log(await client.getSalesorder('SO-000100'));

        console.log(await client.getContactWithFullAdresses('116240000000351141'));
    } catch (error) {
        console.error(error);
    }
}
main();
