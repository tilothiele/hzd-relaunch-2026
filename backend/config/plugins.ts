export default () => ({
  'hzd-plugin': {
    enabled: true,
    resolve: './src/plugins/hzd-plugin'
  },

  // https://docs.strapi.io/cms/plugins/graphql
  graphql: {
    config: {
      landingPage: true
    }
  }
});


