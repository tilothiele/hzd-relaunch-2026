import dogRoutes from '../../routes/dog';
import breederRoutes from '../../routes/breeder';
import litterRoutes from '../../routes/litter';
import memberRoutes from '../../routes/member';

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
  ...litterRoutes,
  ...memberRoutes
];