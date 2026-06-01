import dog from "../../content-types/dog/schema.json"
import breeder from "../../content-types/breeder/schema.json"
import litter from "../../content-types/litter/schema.json"
import geoLocation from "../../content-types/geo-location/schema.json"
/*
import homepage from "../../content-types/homepage/schema.json"
import newsArticle from "../../content-types/news-article/schema.json"
import homepageSection from "../../content-types/homepage-section/schema.json"
import contact from "../../content-types/contact/schema.json"
*/
// ContentTypeDefinition

// https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks

async function findUserIdByCId(cId: number | undefined | null) {
	if (cId === undefined || cId === null) {
		return undefined
	}

	const user = await strapi.db.query('plugin::users-permissions.user').findOne({
		where: { cId },
		select: ['id'],
	})

	return user?.id
}

async function findBreederIdByCId(cId: number | undefined | null) {
	if (cId === undefined || cId === null) {
		return undefined
	}

	const breederEntry = await strapi.db.query('plugin::hzd-plugin.breeder').findOne({
		where: { cId },
		select: ['id'],
	})

	return breederEntry?.id
}

async function linkBreederMemberFromCId(data: Record<string, any>) {
	if (data.member || data.cId === undefined || data.cId === null) {
		return
	}

	const userId = await findUserIdByCId(data.cId)
	if (userId) {
		data.member = userId
	}
}

async function syncDogRelationsFromCIds(data: Record<string, any>) {
	if (!data.owner && data.cOwnerId !== undefined && data.cOwnerId !== null) {
		const userId = await findUserIdByCId(data.cOwnerId)
		if (userId) {
			data.owner = userId
		}
	}

	if (!data.breeder && data.cBreederId !== undefined && data.cBreederId !== null) {
		const breederId = await findBreederIdByCId(data.cBreederId)
		if (breederId) {
			data.breeder = breederId
		}
	}
}

function resolveOwnerIdFromPayload(data: Record<string, any>) {
	if (!data.owner) {
		return undefined
	}

	if (typeof data.owner === 'object') {
		if (Array.isArray(data.owner.connect) && data.owner.connect.length > 0) {
			const first = data.owner.connect[0]
			return typeof first === 'object' ? first.id : first
		}
		if (data.owner.id) {
			return data.owner.id
		}
		return undefined
	}

	return data.owner
}

async function syncDogLocationFromOwner(
	data: Record<string, any>,
	existingLocationId?: number,
) {
	const ownerId = resolveOwnerIdFromPayload(data)
	if (!ownerId) {
		return
	}

	const owner = await strapi.entityService.findOne(
		'plugin::users-permissions.user',
		ownerId,
	)

	if (
		owner
		&& owner.locationLat !== undefined
		&& owner.locationLat !== null
		&& owner.locationLng !== undefined
		&& owner.locationLng !== null
	) {
		const newLocation: Record<string, unknown> = {
			lat: owner.locationLat,
			lng: owner.locationLng,
		}

		if (existingLocationId) {
			newLocation.id = existingLocationId
		}

		data.Location = newLocation
	}
}

const dogLifecycles = {
	async beforeCreate(event) {
		console.log('HZD-PLUGIN: dog.beforeCreate triggered', event.params)
		const { data } = event.params

		await syncDogRelationsFromCIds(data)
		await syncDogLocationFromOwner(data)
	},
	async beforeUpdate(event) {
		const { data, where } = event.params
		console.log('HZD-PLUGIN: dog.beforeUpdate triggered', event.params, data)

		const existingDog = await strapi.entityService.findOne(
			'plugin::hzd-plugin.dog',
			where.id,
			{
				populate: { owner: true, Location: true },
			},
		)

		if (!existingDog) {
			console.warn('HZD-PLUGIN: dog.beforeUpdate - Dog not found', where.id)
			return
		}

		await syncDogRelationsFromCIds(data)

		const isDisconnectingOwner = data.owner
			&& typeof data.owner === 'object'
			&& Array.isArray(data.owner.disconnect)
			&& data.owner.disconnect.length > 0
			&& (!data.owner.connect || data.owner.connect.length === 0)

		if (!data.owner && !isDisconnectingOwner && existingDog.owner) {
			data.owner = existingDog.owner.id
		}

		const existingLocationId = existingDog.Location?.id
		await syncDogLocationFromOwner(data, existingLocationId)
	},
}

const breederLifecycles = {
	async beforeCreate(event) {
		await linkBreederMemberFromCId(event.params.data)
	},
	async beforeUpdate(event) {
		await linkBreederMemberFromCId(event.params.data)
	},
}

export default {
	dog: {
		schema: dog,
		lifecycles: dogLifecycles,
	},
	breeder: {
		schema: breeder,
		lifecycles: breederLifecycles,
	},
	litter: {
		schema: litter,
	},
	'geo-location': {
		schema: geoLocation,
	},
}
