/**
 *  service
 */

import type { Core, Module } from '@strapi/strapi'
import { factories } from '@strapi/strapi'

type BreederService = Module<'plugin::hzd-plugin.breeder'>['services']['registry']

const createBreederService = (): BreederService =>
  factories.createCoreService('plugin::hzd-plugin.breeder')

export default createBreederService()
