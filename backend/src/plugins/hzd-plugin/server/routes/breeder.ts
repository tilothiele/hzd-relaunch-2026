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
  {
    method: 'POST',
    path: '/breeders',
    handler: 'breeder.create',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
  {
    method: 'PUT',
    path: '/breeders/:id',
    handler: 'breeder.update',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
];
