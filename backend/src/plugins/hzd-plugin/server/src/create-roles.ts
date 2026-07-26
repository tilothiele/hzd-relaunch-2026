/**
 * Direktes Skript zum Anlegen der Rollen
 * Führe aus: npm run strapi console
 * Dann: require('./src/plugins/hzd-plugin/server/src/create-roles').default(strapi)
 */

import type { Core } from '@strapi/strapi';
import { setupRoles } from './setup-roles';

export default async function createRoles(strapi: Core.Strapi) {
  console.log('🔧 Creating roles...\n');
  await setupRoles(strapi);
  console.log('\n✅ Done! Please check the admin UI for the roles.');
}








