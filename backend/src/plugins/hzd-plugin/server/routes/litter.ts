export default [
  {
    method: 'GET',
    path: '/litters',
    handler: 'litter.find',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/litters/:id',
    handler: 'litter.findOne',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/litter/:id',
    handler: 'litter.findOne',
    config: {
      auth: false, // öffentlich - alternativer Pfad im Singular
    },
  },
];
