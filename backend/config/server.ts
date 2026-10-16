export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: {
    // Traefik terminiert TLS. Ohne dieses Flag bleibt die Verbindung zu
    // Strapi "http", und strapi-identity darf das Secure-Cookie
    // strapi_admin_mfa nicht setzen.
    koa: env.bool('SERVER_PROXY', true),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  transfer: {
    remote: {
      enabled: true, // must NOT be false
    }
  },
  logger: {
    config: {
      level: env('LOG_LEVEL', 'debug'),
    },
  },
});
