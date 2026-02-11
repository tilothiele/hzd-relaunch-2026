
const { createStrapi } = require('@strapi/strapi');
require('dotenv').config();

declare var strapi: any;

async function testNegativeCaching() {
    console.log('--- Starting Geolocation Negative Caching Test ---');

    // Use distDir: 'dist' as usual, we will rebuild before running
    const app = await createStrapi({ distDir: 'dist' }).load();
    console.log('Strapi loaded.');

    const INVALID_ZIP = '99999';
    const COUNTRY = 'DE';
    const KEY = `${COUNTRY}-${INVALID_ZIP}`;
    const uid = 'plugin::hzd-plugin.geo-location';

    try {
        const service = strapi.plugin('hzd-plugin').service('geolocation');

        console.log(`1. Calling getGeoLocationByZip for invalid ZIP: ${INVALID_ZIP}`);
        const result1 = await service.getGeoLocationByZip(INVALID_ZIP, COUNTRY);

        if (result1 !== null) {
            console.error('FAILURE: Expected null result for invalid ZIP, got:', result1);
            process.exit(1);
        }
        console.log('SUCCESS: Got null result as expected.');

        // Verify DB entry
        console.log(`2. Verifying DB entry for ${KEY}...`);
        const entries = await strapi.documents(uid).findMany({
            filters: { Key: KEY },
            limit: 1
        });

        if (entries.length === 0) {
            console.error('FAILURE: No cache entry found for negative result.');
            process.exit(1);
        }

        const entry = entries[0];
        console.log('DB Entry:', entry);

        if (entry.lat === null && entry.lng === null) {
            console.log('SUCCESS: Entry has null lat/lng (negative cache).');
        } else {
            console.log('FAILURE: Entry coordinates are not null:', entry);
            process.exit(1);
        }

        console.log('3. Calling getGeoLocationByZip again (should hit cache)...');
        // We can't easily verify "cache hit" programmatically without mocking logs or measuring time, 
        // but getting null again confirms it works.
        const result2 = await service.getGeoLocationByZip(INVALID_ZIP, COUNTRY);

        if (result2 !== null) {
            console.error('FAILURE: Expected null result on second call, got:', result2);
            process.exit(1);
        }
        console.log('SUCCESS: Got null result on second call.');

    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    } finally {
        app.destroy();
    }
}


testNegativeCaching().catch(console.error);

export { };
