import dog from "../../content-types/dog/schema.json"
import breeder from "../../content-types/breeder/schema.json"
import litter from "../../content-types/litter/schema.json"
import geoLocation from "../../content-types/geo-location/schema.json"
/*
import homepage from "../../content-types/homepage/schema.json"
import newsArticle from "../../content-types/news-article/schema.json"
import homepageSection from "../../content-types/homepage-section/schema.json"
import contact from "../../content-types/contact/schema.json"
*/
// ContentTypeDefinition

// https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks

// https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks
const dogLifecycles = {
    async beforeCreate(event) {
        console.log('HZD-PLUGIN: dog.beforeCreate triggered', event.params);
        const { data } = event.params;

        let ownerId;
        if (data.owner) {
            if (typeof data.owner === 'object') {
                if (Array.isArray(data.owner.connect) && data.owner.connect.length > 0) {
                    ownerId = data.owner.connect[0].id;
                } else if (data.owner.id) {
                    ownerId = data.owner.id;
                }
            } else {
                ownerId = data.owner;
            }
        }

        if (ownerId) {
            const owner = await strapi.entityService.findOne('plugin::users-permissions.user', ownerId);
            if (owner && (owner.locationLat !== undefined && owner.locationLat !== null) && (owner.locationLng !== undefined && owner.locationLng !== null)) {
                data.Location = {
                    lat: owner.locationLat,
                    lng: owner.locationLng
                };
            }
        }
    },
    async beforeUpdate(event) {
        const { data, where } = event.params;
        console.log('HZD-PLUGIN: dog.beforeUpdate triggered', event.params, data);

        // Always fetch the current dog data to get existing owner and existing Location ID
        const existingDog = await strapi.entityService.findOne('plugin::hzd-plugin.dog', where.id, {
            populate: { owner: true, Location: true }
        });

        if (!existingDog) {
            console.warn('HZD-PLUGIN: dog.beforeUpdate - Dog not found', where.id);
            return;
        }

        let ownerId;

        // Try to get new owner from payload
        if (data.owner) {
            console.log('HZD-PLUGIN: owner in payload', data.owner);
            if (typeof data.owner === 'object') {
                if (Array.isArray(data.owner.connect) && data.owner.connect.length > 0) {
                    ownerId = data.owner.connect[0].id;
                } else if (data.owner.id) {
                    ownerId = data.owner.id;
                }
            } else {
                ownerId = data.owner;
            }
        }

        // If no new owner found in payload, use existing owner
        if (!ownerId) {
            // Check if we are explicitly disconnecting the owner
            const isDisconnecting = data.owner && typeof data.owner === 'object' &&
                Array.isArray(data.owner.disconnect) && data.owner.disconnect.length > 0 &&
                (!data.owner.connect || data.owner.connect.length === 0);

            if (!isDisconnecting && existingDog.owner) {
                ownerId = existingDog.owner.id;
            }
        }

        if (ownerId) {
            console.log('HZD-PLUGIN: fetching ownerId', ownerId);
            // No populate needed for scalar fields locationLat/locationLng
            const owner = await strapi.entityService.findOne('plugin::users-permissions.user', ownerId);

            console.log('HZD-PLUGIN: owner data', owner);

            if (owner && (owner.locationLat !== undefined && owner.locationLat !== null) && (owner.locationLng !== undefined && owner.locationLng !== null)) {
                // Strictly construct the component data
                const newLocation: any = {
                    lat: owner.locationLat,
                    lng: owner.locationLng
                };

                // CRITICAL: Preserve the existing component ID if it exists
                // Otherwise Strapi might try to create a new one or fail to update the relation correctly
                if (existingDog.Location && existingDog.Location.id) {
                    newLocation.id = existingDog.Location.id;
                }

                console.log('HZD-PLUGIN: Syncing location with strict data (preserving ID)', newLocation);
                data.Location = newLocation;
            } else {
                console.log('HZD-PLUGIN: No Location to sync (owner has none)');
            }
        }
    }
}

export default {
    dog: {
        schema: dog,
        lifecycles: dogLifecycles
    },
    breeder: {
        schema: breeder
    },
    litter: {
        schema: litter
    },
    'geo-location': {
        schema: geoLocation
    }
};
