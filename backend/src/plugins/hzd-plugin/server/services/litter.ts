/**
 *  service
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = Record<string, any>

const coreServiceFactory = factories.createCoreService('plugin::hzd-plugin.litter')

export default ({ strapi }: { strapi: Core.Strapi }): AnyService => {
  return coreServiceFactory({ strapi } as any)
}