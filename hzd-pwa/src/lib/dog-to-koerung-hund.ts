import type { Dog } from '@/services/db'
import type {
	KoerungFarbe,
	KoerungGeschlecht,
	KoerungHund,
} from '@/types/koerung-veranstaltung'

function normalizeDateForInput(dateString: string): string {
	if (!dateString) {
		return ''
	}

	if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
		return dateString.slice(0, 10)
	}

	const date = new Date(dateString)
	if (Number.isNaN(date.getTime())) {
		return ''
	}

	return date.toISOString().slice(0, 10)
}

function mapSexToKoerungGeschlecht(sex: string): KoerungGeschlecht {
	if (sex === 'M' || sex === 'R') {
		return 'R'
	}

	if (sex === 'F' || sex === 'H') {
		return 'H'
	}

	return ''
}

function normalizeKoerungFarbe(color: string): KoerungFarbe {
	if (color === 'S' || color === 'SM' || color === 'B') {
		return color
	}

	return ''
}

export function mapDogToKoerungHundFields(
	dog: Dog,
): Pick<
	KoerungHund,
	| 'vollerZwingername'
	| 'zuchtbuchnummer'
	| 'geschlecht'
	| 'wurftag'
	| 'farbe'
	| 'besitzer'
	| 'mitgliedsnummer'
> {
	return {
		vollerZwingername: dog.fullkennelname ?? '',
		zuchtbuchnummer: dog.cStudBookNumber ?? '',
		geschlecht: mapSexToKoerungGeschlecht(dog.sex),
		wurftag: normalizeDateForInput(dog.dateofbirth),
		farbe: normalizeKoerungFarbe(dog.color),
		besitzer: dog.ownerName ?? '',
		mitgliedsnummer: dog.ownerMembershipNumber ?? '',
	}
}
