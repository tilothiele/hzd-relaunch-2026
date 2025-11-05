export default [
  {
    method: 'GET',
    path: '/dogs',
    handler: 'dog.find',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/dogs/:id',
    handler: 'dog.findOne',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/dog/:id',
    handler: 'dog.findOne',
    config: {
      auth: false, // öffentlich - alternativer Pfad im Singular
    },
  },
];
