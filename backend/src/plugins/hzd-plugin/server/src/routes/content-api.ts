import dogRoutes from '../../routes/dog';

export default [
  {
    method: "GET",
    path: "/",
    handler: "controller.index",
    config: {
      policies: [],
    },
  },
  ...dogRoutes,
];