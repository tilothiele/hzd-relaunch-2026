import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  console.log('DATABASE_CLIENT', client);
  console.log('DATABASE_HOST', env('DATABASE_HOST', 'localhost'));
  console.log('DATABASE_PORT', env.int('DATABASE_PORT', 3306));
  console.log('DATABASE_NAME', env('DATABASE_NAME', 'strapi'));
  console.log('DATABASE_USERNAME', env('DATABASE_USERNAME', 'strapi'));
  console.log('DATABASE_PASSWORD', env('DATABASE_PASSWORD', 'strapi'));
  console.log('DATABASE_SSL', env.bool('DATABASE_SSL', false));
  console.log('DATABASE_SSL_KEY', env('DATABASE_SSL_KEY', undefined));
  console.log('DATABASE_SSL_CERT', env('DATABASE_SSL_CERT', undefined));
  console.log('DATABASE_SSL_CA', env('DATABASE_SSL_CA', undefined));
  console.log('DATABASE_SSL_CAPATH', env('DATABASE_SSL_CAPATH', undefined));
  console.log('DATABASE_SSL_CIPHER', env('DATABASE_SSL_CIPHER', undefined));
  console.log('DATABASE_SSL_REJECT_UNAUTHORIZED', env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true));
  console.log('DATABASE_SCHEMA', env('DATABASE_SCHEMA', 'public'));
  console.log('DATABASE_POOL_MIN', env.int('DATABASE_POOL_MIN', 2));
  console.log('DATABASE_POOL_MAX', env.int('DATABASE_POOL_MAX', 10));
  console.log('DATABASE_CONNECTION_TIMEOUT', env.int('DATABASE_CONNECTION_TIMEOUT', 60000));

  const connections = {
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
