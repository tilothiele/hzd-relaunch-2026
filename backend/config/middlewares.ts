export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ['https://cdn.ckeditor.com'],
           'connect-src': ['https://proxy-event.ckeditor.com']
          },
        },
      },
    },
  {
    name: 'strapi::cors',
    config: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : process.env.NODE_ENV === 'development'
          ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'https://hzd-backend.app.tilothiele.de']
          : [],
      credentials: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
