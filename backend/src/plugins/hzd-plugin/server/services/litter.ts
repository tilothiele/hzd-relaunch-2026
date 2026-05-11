/**
 *  service
 */

import type { Core, Module } from '@strapi/strapi'
import { factories } from '@strapi/strapi'

type LitterService = Module<'plugin::hzd-plugin.litter'>['services']['registry']

const createLitterService = (): LitterService =>
  factories.createCoreService('plugin::hzd-plugin.litter')

export default createLitterService()
