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
const dogLifecycles = {
    async beforeCreate(event) {
        const { data } = event.params;

        if (data.owner) {
            const ownerId = typeof data.owner === 'object' ? data.owner.id : data.owner;
            const owner = await strapi.entityService.findOne('plugin::users-permissions.user', ownerId, {
                populate: ['geoLocation']
            });
            if (owner && owner.geoLocation) {
                const { id, ...geoData } = owner.geoLocation;
                data.Location = geoData;
            }
        }
    },
    async beforeUpdate(event) {
        const { data, where } = event.params;

        let ownerId;
        if (data.owner) {
            ownerId = typeof data.owner === 'object' ? data.owner.id : data.owner;
        } else {
            // additional lookup if owner is not in the payload
            const dog = await strapi.entityService.findOne('plugin::hzd-plugin.dog', where.id, {
                populate: ['owner']
            });
            if (dog && dog.owner) {
                ownerId = dog.owner.id;
            }
        }

        if (ownerId) {
            const owner = await strapi.entityService.findOne('plugin::users-permissions.user', ownerId, {
                populate: ['geoLocation']
            });
            if (owner && owner.geoLocation) {
                const { id, ...geoData } = owner.geoLocation;
                data.Location = geoData;
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
