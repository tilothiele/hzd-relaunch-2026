/**
 * Zentrale Tabelle für das Top/Bottom-Padding der Sections mit
 * `layout.padding`-Komponente (Strapi: small / middle / large).
 *
 * Hier die Werte manuell optimieren – jede Section hat ein eigenes
 * Config-Objekt (bewusst nicht global geteilt, damit Sections unabhängig
 * angepasst werden können).
 */

export type SectionPaddingSize = 'small' | 'middle' | 'large'

export interface SectionPaddingConfig {
	/** Fallback-Top, wenn im CMS kein Wert gesetzt ist */
	defaultTop: string
	/** Fallback-Bottom, wenn im CMS kein Wert gesetzt ist */
	defaultBottom: string
	small: string
	middle: string
	large: string
}

export type SectionPaddingKey =
	| 'richText'
	| 'teaserTextWithImage'
	| 'textColumns'
	| 'adventCalendar'
	| 'cardSectionBorderedBox'
	| 'cardSectionFullCover'

export const SECTION_PADDING: Record<SectionPaddingKey, SectionPaddingConfig> = {
	richText: {
		defaultTop: '1em',
		defaultBottom: '1em',
		small: '1rem',
		middle: '2rem',
		large: '3rem',
	},
	teaserTextWithImage: {
		defaultTop: '1em',
		defaultBottom: '1em',
		small: '1rem',
		middle: '2rem',
		large: '3rem',
	},
	textColumns: {
		defaultTop: '1.2rem',
		defaultBottom: '1.5rem',
		small: '1rem',
		middle: '3rem',
		large: '5rem',
	},
	adventCalendar: {
		defaultTop: '2.5rem',
		defaultBottom: '2.5rem',
		small: '1rem',
		middle: '2rem',
		large: '3rem',
	},
	cardSectionBorderedBox: {
		defaultTop: '3em',
		defaultBottom: '3em',
		small: '1rem',
		middle: '2rem',
		large: '3rem',
	},
	cardSectionFullCover: {
		defaultTop: '0',
		defaultBottom: '0',
		small: '1rem',
		middle: '3rem',
		large: '5rem',
	},
}

export function sectionPaddingTop(
	config: SectionPaddingConfig,
	size: SectionPaddingSize | null | undefined,
): string {
	if (!size) {
		return config.defaultTop
	}
	return config[size]
}

export function sectionPaddingBottom(
	config: SectionPaddingConfig,
	size: SectionPaddingSize | null | undefined,
): string {
	if (!size) {
		return config.defaultBottom
	}
	return config[size]
}
