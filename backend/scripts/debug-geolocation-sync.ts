
const { createStrapi } = require('@strapi/strapi');
require('dotenv').config();

declare var strapi: any;

async function testGeolocationSync() {
    console.log('--- Starting Geolocation Sync Test ---');

    console.log('Initializing Strapi...');
    const app = await createStrapi({ distDir: 'dist' }).load();
    console.log('Strapi loaded.');

    try {
        const service = strapi.plugin('hzd-plugin').service('geolocation-sync');
        if (!service) {
            throw new Error('Geolocation sync service not found');
        }

        console.log('Starting syncGeolocations...');
        await service.syncGeolocations();
        console.log('syncGeolocations completed successfully.');

        // Verify status
        const status = service.getStatus();
        console.log('Service Status:', status);

    } catch (error) {
        console.error('Error during geolocation sync test:', error);
    } finally {
        console.log('Stopping Strapi...');
        app.destroy();
    }
}

testGeolocationSync().catch(console.error);
