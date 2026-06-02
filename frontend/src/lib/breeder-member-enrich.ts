import type { Breeder } from '@/types'

function mergeOwnerMembers(
	breeder: Breeder,
	ownerMembers: NonNullable<Breeder['owner_members']>,
): Breeder {
	if (ownerMembers.length === 0) {
		return breeder
	}

	return {
		...breeder,
		owner_members: ownerMembers,
		member: breeder.member ?? ownerMembers[0],
	}
}

export async function enrichBreedersWithMembers(
	breeders: Breeder[],
): Promise<Breeder[]> {
	const documentIds = [...new Set(
		breeders
			.map((breeder) => breeder.documentId)
			.filter(Boolean),
	)]

	if (documentIds.length === 0) {
		return breeders
	}

	try {
		const response = await fetch('/api/breeders/owner-members', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ documentIds }),
			cache: 'no-store',
		})

		if (!response.ok) {
			return breeders
		}

		const payload = await response.json() as {
			data?: Record<string, NonNullable<Breeder['owner_members']>>
		}

		const ownerMembersByDocumentId = payload.data ?? {}

		return breeders.map((breeder) => {
			const ownerMembers = ownerMembersByDocumentId[breeder.documentId] ?? []
			return mergeOwnerMembers(breeder, ownerMembers)
		})
	} catch {
		return breeders
	}
}
