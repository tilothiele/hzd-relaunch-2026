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
  {
    method: 'POST',
    path: '/litters',
    handler: 'litter.create',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
  {
    method: 'PUT',
    path: '/litters/:id',
    handler: 'litter.update',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
];
