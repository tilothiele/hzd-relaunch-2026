import dog from "../../content-types/dog/schema.json"
import member from "../../content-types/member/schema.json"
import breeder from "../../content-types/breeder/schema.json"
import litter from "../../content-types/litter/schema.json"
import puppy from "../../content-types/puppy/schema.json"

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
    member: {
        schema: member
    },
    litter: {
        schema: litter
    },
    puppy: {
        schema: puppy
    }
};
