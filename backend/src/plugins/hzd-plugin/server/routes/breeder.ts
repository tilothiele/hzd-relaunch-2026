export default [
  {
    method: 'GET',
    path: '/breeders',
    handler: 'breeder.find',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/breeders/:id',
    handler: 'breeder.findOne',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/breeder/:id',
    handler: 'breeder.findOne',
    config: {
      auth: false, // öffentlich - alternativer Pfad im Singular
    },
  },
];
