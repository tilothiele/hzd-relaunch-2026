/** Interner Pfad einer Strapi-Page. Slugs sind oft mit führendem „/“ gespeichert. */
export function pagePath(
	page: { slug?: string | null } | null | undefined,
): string | null {
	const slug = page?.slug?.trim()
	if (!slug) {
		return null
	}
	return slug.startsWith('/') ? slug : `/${slug}`
}
