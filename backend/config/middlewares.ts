
const cors = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : process.env.NODE_ENV === 'development'
          ? ['http://localhost:1337', 'http://127.0.0.1:1337', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'https://hzd-backend.app.tilothiele.de']
          : ['https://hzd-backend.app.tilothiele.de', 'https://hovawarte.app.tilothiele.de']

console.log('cors', cors)
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            //'script-src': [],
            "connect-src": ["'self'", "https:", "apollo-server-landing-page.cdn.apollographql.com", 'https://proxy-event.ckeditor.com'],
            "img-src": ["'self'", "data:", "blob:", "apollo-server-landing-page.cdn.apollographql.com"],
            "script-src": ["'self'", "'unsafe-inline'", "apollo-server-landing-page.cdn.apollographql.com", 'http://localhost:1337', 'http://localhost:3000', 'http://127.0.0.1:1337', 'https://hzd-backend.app.tilothiele.de', 'https://cdn.ckeditor.com'],
            "style-src": ["'self'", "'unsafe-inline'", "apollo-server-landing-page.cdn.apollographql.com"],
            "frame-src": ["sandbox.embed.apollographql.com"]
          },
        },
      },
    },
  {
    name: 'strapi::cors',
    config: {
      origin: cors,
      credentials: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
