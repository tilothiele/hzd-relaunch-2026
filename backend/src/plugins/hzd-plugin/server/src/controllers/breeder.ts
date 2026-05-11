/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core, UID } from '@strapi/strapi'

type BreederController = Core.CoreAPI.Controller.ContentType<UID.ContentType>

export default ({ strapi }: { strapi: Core.Strapi }): BreederController => {
  return factories.createCoreController('plugin::hzd-plugin.breeder')({ strapi })
}


