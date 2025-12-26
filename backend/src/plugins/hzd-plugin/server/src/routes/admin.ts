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
    method: "GET",
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
];