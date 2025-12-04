export default [
  {
    method: 'GET',
    path: '/members',
    handler: 'member.find',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/members/:id',
    handler: 'member.findOne',
    config: {
      auth: false, // öffentlich
    },
  },
  {
    method: 'GET',
    path: '/member/:id',
    handler: 'member.findOne',
    config: {
      auth: false, // öffentlich - alternativer Pfad im Singular
    },
  },
  {
    method: 'POST',
    path: '/members',
    handler: 'member.create',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
  {
    method: 'PUT',
    path: '/members/:id',
    handler: 'member.update',
    config: {
      // auth wird weggelassen, damit Standard-Authentifizierung verwendet wird
    },
  },
];
