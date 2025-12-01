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
  {
    method: 'POST',
    path: '/dogs',
    handler: 'dog.create',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'PUT',
    path: '/dogs/:id',
    handler: 'dog.update',
    config: {
      auth: false, // öffentlich
    },
  },
];
