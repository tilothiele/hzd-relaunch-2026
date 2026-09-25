import type { GalleryImage } from '@/types'

export function resolveGalleryPhotographerName(img: GalleryImage): string {
	const photographer = img.Photographer
	if (photographer) {
		const fullName = `${photographer.firstName || ''} ${photographer.lastName || ''}`.trim()
		if (fullName) return fullName
		if (photographer.username) return photographer.username
	}

	const fallbackName = img.PhotographerName?.trim()
	if (fallbackName) return fallbackName

	return ''
}

export function formatGalleryImageMeta(img: GalleryImage): string {
	const date = new Date(img.DateOfPicture).toLocaleDateString('de-DE')
	const photographer = resolveGalleryPhotographerName(img)
	if (!photographer) return date
	return `${date} · ${photographer}`
}
