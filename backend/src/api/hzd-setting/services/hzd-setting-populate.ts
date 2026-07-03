/**
 * hzd-setting populate
 *
 * Stellt das implizite `populate=*` für den hzd-setting Endpoint bereit.
 *
 * Da das Schema nur aus Media-Feldern besteht (keine Relationen, keine
 * Dynamic Zones), genügt der einfache Wildcard-Populate.
 */

export function buildHzdSettingPopulate(): Record<string, unknown> {
	return {
		populate: '*',
	}
}