/**
 * Debug-Skript zum Prüfen der Rollen
 * Führe aus: pnpm strapi console
 * Dann: require('./src/plugins/hzd-plugin/server/src/debug-roles').default(strapi)
 */

import type { Core } from '@strapi/strapi';

export default async function debugRoles(strapi: Core.Strapi) {
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
    console.log(`   Standard roles (public/authenticated): ${allRoles.filter(r => r.type === 'public' || r.type === 'authenticated').length}`);
    console.log(`   Custom roles: ${allRoles.filter(r => r.type !== 'public' && r.type !== 'authenticated').length}`);
  } catch (error) {
    console.error('❌ Error checking roles:', error);
  }
}

