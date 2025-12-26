import dogRoutes from '../../routes/dog';
import breederRoutes from '../../routes/breeder';
import litterRoutes from '../../routes/litter';

export default [
  {
    method: "GET",
    path: "/",
    handler: "controller.index",
    config: {
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/geolocation-sync/trigger",
    handler: "geolocation-sync.trigger",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/geolocation-sync/status",
    handler: "geolocation-sync.status",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/geolocation/find",
    handler: "geolocation.getGeoLocationByZip",
    config: {
      policies: [],
    },
  },
  ...dogRoutes,
  ...breederRoutes,
  ...litterRoutes,
];