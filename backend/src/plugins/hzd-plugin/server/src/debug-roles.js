/**
 * Debug-Skript zum Prüfen der Rollen (JavaScript-Version für Console)
 * Führe aus: pnpm strapi console
 * Dann: require('./dist/src/plugins/hzd-plugin/server/src/debug-roles.js').default(strapi)
 * ODER: Kopiere den Code direkt in die Console
 */

module.exports = {
  default: async function debugRoles(strapi) {
    console.log('🔍 Checking roles...\n');

    try {
      const allRoles = await strapi
        .query('plugin::users-permissions.role')
        .findMany();

      // Sortiere manuell nach Name
      allRoles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      console.log(`Found ${allRoles.length} roles:\n`);
      
      for (const role of allRoles) {
        console.log(`- ${role.name} (type: ${role.type}, id: ${role.id})`);
        if (role.localCommunity) {
          console.log(`  → LocalCommunity: ${role.localCommunity.id}`);
        }
        if (role.regionalUnit) {
          console.log(`  → RegionalUnit: ${role.regionalUnit.id}`);
        }
      }

      console.log(`\n📊 Summary:`);
      console.log(`   Total roles: ${allRoles.length}`);
      const standardRoles = allRoles.filter(r => r.type === 'public' || r.type === 'authenticated');
      const customRoles = allRoles.filter(r => r.type !== 'public' && r.type !== 'authenticated');
      console.log(`   Standard roles (public/authenticated): ${standardRoles.length}`);
      console.log(`   Custom roles: ${customRoles.length}`);
    } catch (error) {
      console.error('❌ Error checking roles:', error);
    }
  }
};

