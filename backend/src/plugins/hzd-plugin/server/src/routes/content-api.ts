import dogRoutes from '../../routes/dog';
import breederRoutes from '../../routes/breeder';

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
  ...breederRoutes,
];