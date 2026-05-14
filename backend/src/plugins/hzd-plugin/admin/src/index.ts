import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import deTranslations from './translations/de.json';
import enTranslations from './translations/en.json';

function loadTranslations(locale: string) {
  if (locale.toLowerCase().startsWith('de')) {
    return deTranslations;
  }

  if (locale === 'en') {
    return enTranslations;
  }

  return {};
}

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'HZD-Verwaltung',
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        const data = loadTranslations(locale);

        return { data, locale };
      })
    );
  },
};
