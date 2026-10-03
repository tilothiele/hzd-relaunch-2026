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
    path: "/reports/users",
    handler: "controller.userReport",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/reports/breeders",
    handler: "controller.breederReport",
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
  {
    method: "POST",
    path: "/litters/send-reminder",
    handler: "litter-reminder.send",
    config: {
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/chromosoft/import-strapi-daten",
    handler: "import-strapi-daten.import_strapi_daten",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/chromosoft/import-strapi-daten/status",
    handler: "import-strapi-daten.status",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/chromosoft/import-strapi-daten/log",
    handler: "import-strapi-daten.downloadLog",
    config: {
      policies: [],
    },
  },
];