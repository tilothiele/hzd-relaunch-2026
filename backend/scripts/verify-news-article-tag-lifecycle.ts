
// @ts-nocheck
const lifecyclesModule = require('../src/api/news-article-tag/content-types/news-article-tag/lifecycles');
const lifecycles = lifecyclesModule.default || lifecyclesModule;

// Mock Strapi global
global.strapi = {
    entityService: {
        findOne: async () => null, // default mock
    },
};

async function runTests() {
    console.log('--- Testing News Article Tag Lifecycles ---');

    // Test 1: beforeCreate - Generate color from label
    const eventCreate1 = {
        params: {
            data: {
                Label: 'Test Label',
            },
        },
    };
    lifecycles.beforeCreate(eventCreate1);
    if (eventCreate1.params.data.TagColorHexCode && /^#[0-9a-f]{6}$/i.test(eventCreate1.params.data.TagColorHexCode)) {
        console.log('PASS: beforeCreate generated valid hex color:', eventCreate1.params.data.TagColorHexCode);
    } else {
        console.error('FAIL: beforeCreate did not generate valid hex color. Got:', eventCreate1.params.data.TagColorHexCode);
    }

    // Test 2: beforeCreate - Respect existing color
    const eventCreate2 = {
        params: {
            data: {
                Label: 'Test Label',
                TagColorHexCode: '#123456',
            },
        },
    };
    lifecycles.beforeCreate(eventCreate2);
    if (eventCreate2.params.data.TagColorHexCode === '#123456') {
        console.log('PASS: beforeCreate respected existing color');
    } else {
        console.error('FAIL: beforeCreate overwrote existing color');
    }

    // Test 3: beforeUpdate - Label changed, Color not provided -> Generate
    const eventUpdate1 = {
        params: {
            data: {
                Label: 'New Label'
            },
            where: { id: 1 }
        }
    };
    // Mock findOne shouldn't be called here, but if it is, return something safe
    global.strapi.entityService.findOne = async () => { console.log('Mock findOne called unexpectedly'); return { Label: 'Old' }; };

    await lifecycles.beforeUpdate(eventUpdate1);
    if (eventUpdate1.params.data.TagColorHexCode) {
        console.log('PASS: beforeUpdate generated color for new label:', eventUpdate1.params.data.TagColorHexCode);
    } else {
        console.error('FAIL: beforeUpdate did not generate color for new label. Data:', eventUpdate1.params.data);
    }

    // Test 4: beforeUpdate - Color cleared -> Fetch existing and generate
    // Mock findOne to return existing entity
    global.strapi.entityService.findOne = async () => ({ Label: 'Existing Label' });
    const eventUpdate2 = {
        params: {
            data: {
                TagColorHexCode: null
            },
            where: { id: 1 }
        }
    };
    await lifecycles.beforeUpdate(eventUpdate2);
    if (eventUpdate2.params.data.TagColorHexCode) {
        console.log('PASS: beforeUpdate generated color from existing label when color cleared:', eventUpdate2.params.data.TagColorHexCode);
    } else {
        console.error('FAIL: beforeUpdate did not generate color when cleared');
    }

    // Test 5: beforeUpdate - Color provided -> No Change
    const eventUpdate3 = {
        params: {
            data: {
                TagColorHexCode: '#ABCDEF'
            },
            where: { id: 1 }
        }
    };
    await lifecycles.beforeUpdate(eventUpdate3);
    if (eventUpdate3.params.data.TagColorHexCode === '#ABCDEF') {
        console.log('PASS: beforeUpdate preserved provided color');
    } else {
        console.error('FAIL: beforeUpdate modified provided color');
    }
}

runTests().catch(console.error);
