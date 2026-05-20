/**
 * @deprecated Nutze init-permissions.ts – bleibt für die Strapi-Console kompatibel.
 *
 * pnpm strapi console
 * await require('./src/plugins/hzd-plugin/server/src/fix-permissions').default(strapi)
 */

export { initPermissions as default, initPermissions } from './init-permissions'
