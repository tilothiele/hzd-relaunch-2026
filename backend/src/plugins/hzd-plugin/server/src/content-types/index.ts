import dog from "../../content-types/dog/schema.json"
import breeder from "../../content-types/breeder/schema.json"
import litter from "../../content-types/litter/schema.json"
/*
import homepage from "../../content-types/homepage/schema.json"
import newsArticle from "../../content-types/news-article/schema.json"
import homepageSection from "../../content-types/homepage-section/schema.json"
import contact from "../../content-types/contact/schema.json"
*/
// ContentTypeDefinition

// https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks
const dogLifecyles = {

}

export default {
    dog: {
        schema: dog,
        lifecyles: dogLifecyles
    },
    breeder: {
        schema: breeder
    },
    litter: {
        schema: litter
    }
};
