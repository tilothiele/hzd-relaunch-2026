/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core, UID } from '@strapi/strapi'

type LitterController = Core.CoreAPI.Controller.ContentType<UID.ContentType>

export default ({ strapi }: { strapi: Core.Strapi }): LitterController => {
  return factories.createCoreController('plugin::hzd-plugin.litter')({ strapi })
}


