/**
 *  service
 */

import { factories } from '@strapi/strapi'
import type { Core, UID } from '@strapi/strapi'

type BreederService = Core.CoreAPI.Service.ContentType<UID.ContentType>

const service = ({ strapi }: { strapi: Core.Strapi }): BreederService =>
  factories.createCoreService('plugin::hzd-plugin.breeder')({ strapi })

export default service
