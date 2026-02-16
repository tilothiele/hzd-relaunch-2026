
const Strapi = require('@strapi/strapi');

async function main() {
    const strapi = await Strapi.compile();
    const app = await strapi.load();
    await app.start();

    try {
        const user = await app.documents('plugin::users-permissions.user').findFirst();
        console.log('User found:', JSON.stringify(user, null, 2));

        if (user) {
            console.log('User ID type:', typeof user.id);
            console.log('User DocumentID:', user.documentId);
            console.log('User DocumentID type:', typeof user.documentId);
        } else {
            console.log('No users found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    app.stop();
    process.exit(0);
}

main();
