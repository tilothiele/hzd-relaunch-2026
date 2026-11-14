// HZD-Plugin Extension: Lifecycle-Hook für Litter.DisplayName binden.
//
// Strapi lädt aus src/extensions/<plugin>/ nur:
//   - **/content-types/**/schema.json  (Schema-Override, wird gemerged)
//   - **/strapi-server.js/.ts          (wird mit dem Plugin-Objekt aufgerufen)
//
// Die Lifecycle-Hooks selbst können von dort nicht automatisch geladen werden,
// daher wird hier der im Content-Type-Ordner liegende Hook (neben schema.json)
// dem Litter-Content-Type des Plugins zugewiesen.
//
// DisplayName wird danach bei create/update immer gesetzt auf:
//   "<breeder.kennelName> - <OrderLetter>-Wurf"  (z. B. "vom Schmollensee - B-Wurf")
import litterLifecycles from './content-types/litter/lifecycles'

export default (plugin: any) => {
	if (plugin.contentTypes?.litter) {
		plugin.contentTypes.litter = {
			...plugin.contentTypes.litter,
			lifecycles: litterLifecycles,
		}
	}

	return plugin
}
