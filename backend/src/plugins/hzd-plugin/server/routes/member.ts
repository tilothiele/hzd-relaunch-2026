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
];
