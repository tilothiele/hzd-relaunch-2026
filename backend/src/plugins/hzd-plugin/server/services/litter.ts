/**
 *  service
 */

import { factories } from '@strapi/strapi'
import type { Core, UID } from '@strapi/strapi'

type LitterService = Core.CoreAPI.Service.ContentType<UID.ContentType>

const service = ({ strapi }: { strapi: Core.Strapi }): LitterService =>
  factories.createCoreService('plugin::hzd-plugin.litter')({ strapi })

export default service
