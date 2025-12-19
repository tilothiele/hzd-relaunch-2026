import type { StrapiApp } from '@strapi/strapi/admin';

import Logo from "./extensions/HZD-Logo.png";
import TestLogo from "./extensions/HZD-Logo-Test.png";
import Favicon from "./extensions/favicon-32x32.png";
import { layouts } from './src/layouts';

const isTest = process.env.STRAPI_ADMIN_TEST === 'true';


export default {
  config: {
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
    auth: {
      logo: isTest ? TestLogo : Logo
    },
    menu: {
      logo: isTest ? TestLogo : Logo,
    },
    head: {
      favicon: Favicon,
    },
  },
  bootstrap(app: StrapiApp) {
    // Content-Manager APIs holen (TypeScript: casten)

    const contentManager = app.getPlugin('content-manager');

    const apis = contentManager.apis // as ContentManagerPlugin['config']['apis'];

    console.log(contentManager);
    console.log(apis);
    //console.log('isTest', isTest);

  },
};
