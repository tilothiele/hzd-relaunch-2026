import type { Core } from '@strapi/strapi';
import cron from 'node-cron';
import { isSearchEnabled, registerSearchDocumentMiddleware, reindexAll, getReindexState } from './search/search-index';

async function setMissingBreederRoles(strapi: Core.Strapi) {
	const knex = strapi.db.connection;
	const hasTable = await knex.schema.hasTable('breeders');
	if (!hasTable) {
		return;
	}

	const hasColumn = await knex.schema.hasColumn('breeders', 'breeder_role');
	if (!hasColumn) {
		return;
	}

	const updatedRows = await knex('breeders')
		.whereNull('breeder_role')
		.update({
			breeder_role: 'B',
		});

	if (updatedRows > 0) {
		strapi.log.info(`[Bootstrap] Set missing breeder_role to B for ${updatedRows} breeders`);
	}
}

export default {
	register({ strapi }: { strapi: Core.Strapi }) {
		strapi.documents.use(async (context, next) => {
			if (context.uid === 'plugin::users-permissions.user' && (context.action === 'create' || context.action === 'update')) {
				const data = (context.params as any).data;

				if (data) {
					const firstName = data.firstName?.trim() || '';
					const lastName = data.lastName?.trim() || '';
					const memberId = data.membershipNumber || '';
					if (firstName || lastName) {
						data.DisplayName = `${firstName} ${lastName}(${memberId})`.trim();
					}

					if (typeof data.zip === 'string' && data.zip.trim() !== '') {
						const geo = strapi.plugin('hzd-plugin')?.service('geolocation');
						if (geo) {
							const countryCode = data.countryCode || 'DE';
							const result = await geo.getGeoLocationByZip(data.zip, countryCode);
							if (result) {
								data.locationLat = result.lat;
								data.locationLng = result.lng;
							}
						}
					}
				}
			}

			if (
				context.uid === 'plugin::hzd-plugin.breeder'
				&& (context.action === 'create' || context.action === 'update')
			) {
				const data = (context.params as any).data;
				const address = data?.Address;
				if (address && typeof address === 'object' && !Array.isArray(address)) {
					const zip = typeof address.Zip === 'string' ? address.Zip.trim() : '';
					if (zip) {
						const geo = strapi.plugin('hzd-plugin')?.service('geolocation');
						if (geo) {
							const rawCountry = typeof address.CountryCode === 'string'
								? address.CountryCode
								: '';
							const countryCode = !rawCountry || rawCountry === 'D' ? 'DE' : rawCountry;
							const result = await geo.getGeoLocationByZip(zip, countryCode);
							if (result) {
								address.locationLat = result.lat;
								address.locationLng = result.lng;
							}
						}
					}
				}
			}

			return next();
		});
		strapi.log.info('[Document Middleware] Registered User data manipulation middleware');
		registerSearchDocumentMiddleware(strapi);
		(strapi as Core.Strapi & {
			hzdSearch?: {
				reindexAll: typeof reindexAll
				getReindexState: typeof getReindexState
				isSearchEnabled: typeof isSearchEnabled
			}
		}).hzdSearch = {
			reindexAll,
			getReindexState,
			isSearchEnabled,
		};
		strapi.log.info('[Search] Document-Hooks für Page, NewsArticle, Dog und Breeder registriert');
	},

	async bootstrap({ strapi }: { strapi: Core.Strapi }) {
		const enabled = strapi.config.get('admin.transfer.remote.enabled', true);
		strapi.log.info(
			`Remote data transfer is ${enabled ? 'ENABLED' : 'DISABLED'}`,
		);
		const salt = strapi.config.get('admin.transfer.token.salt', '');
		strapi.log.info(
			`Remote data transfer salt is ${salt}`,
		);

		await setMissingBreederRoles(strapi);

		const searchCron = process.env.SEARCH_REINDEX_CRON || '0 3 * * *';
		if (isSearchEnabled()) {
			cron.schedule(
				searchCron,
				async () => {
					try {
						await reindexAll(strapi);
					} catch (error) {
						strapi.log.error('[Search] Nächtliche Vollindexierung fehlgeschlagen', error);
					}
				},
				{ timezone: 'Europe/Berlin' },
			);
			strapi.log.info(`[Search] Vollindexierung geplant: ${searchCron} (Europe/Berlin)`);
		} else {
			strapi.log.info('[Search] Vollindexierung nicht geplant, MEILI_HOST fehlt');
		}

		const uid = 'api::form-instance.form-instance';

		try {
			const docService = strapi.documents(uid);

			if (docService) {
				const originalCreate = docService.create.bind(docService);

				docService.create = async (params: any) => {
					const result = await originalCreate(params);

					try {
						if (result && result.documentId) {
							await strapi.service(uid).sendConfirmationEmail(result.documentId);
						}
					} catch (err) {
						strapi.log.error('Error sending confirmation email in document service extension', err);
					}

					return result;
				};
				strapi.log.info('[Bootstrap] Extended form-instance create with form notification emails');
			}
		} catch (error) {
			strapi.log.error('Failed to extend form-instance document service', error);
		}
	},
};
