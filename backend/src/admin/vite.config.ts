import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // Force Vite to pre-bundle CJS dependencies so ESM imports work in admin dev.
    // Without this, Vite serves raw CJS (`require(...)`) and the browser throws
    // "require is not defined".
    optimizeDeps: {
      include: [
        // Local/official CKEditor admin entries + their CJS deps
        '@_sh/strapi-plugin-ckeditor/strapi-admin',
        '@ckeditor/strapi-plugin-ckeditor/strapi-admin',
        'sanitize-html',
        'htmlparser2',
        // yup@0.32.9 ESM build imports these CJS packages
        'yup',
        'property-expr',
        'toposort',
        'nanoclone',
        'lodash/camelCase',
        'lodash/has',
        'lodash/mapKeys',
        'lodash/mapValues',
        'lodash/snakeCase',
        // Other CJS/UMD packages pulled into the admin graph
        'fuzzysort',
        'es-toolkit/compat',
        'es-toolkit/compat/isEqual',
        'extend',
        'debug',
        '@casl/ability',
        '@casl/ability/extra',
      ],
    },
  });
};
