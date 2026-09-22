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
    path: '/litters/search',
    handler: 'litter.search',
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
      // Prüfung im Controller: eingeloggter Züchter und eigener Zwinger.
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: '/litters/:id',
    handler: 'litter.update',
    config: {
      // Prüfung im Controller: eingeloggter Züchter und eigener Zwinger.
      auth: false,
    },
  },
];
