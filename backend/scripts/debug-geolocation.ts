
require('dotenv').config();
const { Client } = require('pg');

// Configuration
const API_URL = 'http://localhost:1337/api/hzd-plugin/geolocation/find';
const ZIP_TO_TEST = '80331';
const COUNTRY_CODE = 'DE';
const KEY_TO_CHECK = `${COUNTRY_CODE}-${ZIP_TO_TEST}`;

async function testPersistence() {
    console.log('--- Starting Geolocation Persistence Test ---');

    // 1. Trigger Geolocation via API
    console.log(`\n1. calling API: ${API_URL}?zip=${ZIP_TO_TEST}&countryCode=${COUNTRY_CODE}`);
    try {
        const response = await fetch(`${API_URL}?zip=${ZIP_TO_TEST}&countryCode=${COUNTRY_CODE}`);
        if (!response.ok) {
            console.warn(`WARN: API Call failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.warn('Response:', text);
            // We don't exit here, as the user might want to check DB for existing data
        } else {
            const data = await response.json();
            console.log('API Response:', data);
        }
    } catch (err) {
        console.warn('WARN: Network error calling API (is Strapi running?):', err.message);
        // Proceed to DB check
    }

    // 2. Verify in Database
    console.log(`\n2. Verifying persistence in DB table 'geo_locations' for key '${KEY_TO_CHECK}'...`);

    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();

        // Note: Column names might vary based on Strapi naming conventions. 
        // Usually 'key', 'Key', 'lat', 'lng' etc. 
        // We try to select all and filter in JS if needed, or guess the column name.
        // 'schema.json' said "Key", "lat", "lng". Strapi v4/v5 usually snake_cases attributes in DB -> "key", "lat", "lng".

        // Try lowercase 'key' first as per error hint
        const res = await client.query(`SELECT * FROM geo_locations WHERE key = $1 LIMIT 1`, [KEY_TO_CHECK]);

        if (res.rows.length > 0) {
            console.log('SUCCESS: Found entry in DB!');
            console.log(res.rows[0]);
        } else {
            console.error('FAILURE: No entry found in DB for key:', KEY_TO_CHECK);
            // Debug: show all entries
            const allRes = await client.query(`SELECT * FROM geo_locations LIMIT 5`);
            console.log('First 5 rows in table:', allRes.rows);
            process.exit(1);
        }

    } catch (err) {
        // If column "Key" or "key" doesn't exist, we might catch valid error
        console.error('Database error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    console.log('\n--- Test Completed Successfully ---');
}


testPersistence().catch(console.error);

export { }; // Make this a module to avoid TS global scope conflict
