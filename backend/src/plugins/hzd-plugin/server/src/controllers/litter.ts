/**
 *  controller
 */

import { factories } from '@strapi/strapi'

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => factories.createCoreController('plugin::hzd-plugin.litter')({ strapi });


