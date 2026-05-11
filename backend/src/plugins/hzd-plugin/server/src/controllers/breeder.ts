/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyController = Record<string, any>

const coreControllerFactory = factories.createCoreController('plugin::hzd-plugin.breeder')

export default ({ strapi }: { strapi: Core.Strapi }): AnyController => {
  return coreControllerFactory({ strapi } as any)
}