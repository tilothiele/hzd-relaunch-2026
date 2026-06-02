import { fetchStrapi } from '@/lib/strapi-client'
import { fetchStrapiServer } from '@/lib/server/strapi-client'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import {
	extractStrapiList,
	extractStrapiPagination,
	extractStrapiSingle,
	normalizeFormFields,
	normalizePage,
	normalizeSections,
	toConnectionResult,
} from '@/lib/strapi/normalize'
import {
	POPULATE_BREEDER_SEARCH,
	POPULATE_CONTACT,
	POPULATE_DOG_SEARCH,
	POPULATE_FORM,
	POPULATE_LAYOUT,
	POPULATE_LITTER_SEARCH,
	POPULATE_NEWS_ARTICLE,
	POPULATE_PAGE_SECTIONS,
	POPULATE_PASSED_DOG,
	POPULATE_PHOTOBOX_COLLECTION,
	POPULATE_SUPPLEMENTAL_DOCUMENT,
} from '@/lib/strapi/populate'
import type {
	AuthUser,
	Breeder,
	BreederSearchResult,
	Dog,
	DogSearchResult,
	FormInstance,
	GlobalLayout,
	Litter,
	LitterSearchResult,
	Page,
} from '@/types'

type FilterValue = Record<string, unknown>

interface LayoutData {
	globalLayout: GlobalLayout
	hzdSetting?: GlobalLayout['HzdSetting']
	announcements?: GlobalLayout['announcements']
}

function mergeLayoutPayload(
	globalLayoutRaw: Record<string, unknown>,
	hzdSetting: GlobalLayout['HzdSetting'],
	announcements: GlobalLayout['announcements'],
): GlobalLayout {
	const page = globalLayoutRaw.page
		? normalizePage(globalLayoutRaw.page as Record<string, unknown>)
		: null
	const authenticatedPage = globalLayoutRaw.authenticated_page
		? normalizePage(globalLayoutRaw.authenticated_page as Record<string, unknown>)
		: null

	return {
		...(globalLayoutRaw as unknown as GlobalLayout),
		page: page as GlobalLayout['page'],
		authenticated_page: authenticatedPage as GlobalLayout['authenticated_page'],
		HzdSetting: hzdSetting,
		announcements,
	}
}

type StrapiFetcher = (
	path: string,
	query?: URLSearchParams,
	options?: { token?: string | null; baseUrl?: string | null; method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown },
) => Promise<unknown>

async function fetchLayoutPayload(
	fetcher: StrapiFetcher,
	baseUrl?: string | null,
	token?: string | null,
): Promise<LayoutData> {
	const [layoutResponse, hzdSettingResponse, announcementsResponse] = await Promise.all([
		fetcher('global-layout', POPULATE_LAYOUT, { token, baseUrl }),
		fetcher('hzd-setting', new URLSearchParams({ populate: '*' }), { token, baseUrl }),
		fetcher(
			'announcements',
			buildStrapiQuery({
				pagination: { pageSize: 100 },
				sort: 'createdAt:desc',
			}),
			{ token, baseUrl },
		),
	])

	const globalLayoutRaw = extractStrapiSingle<Record<string, unknown>>(layoutResponse)
	if (!globalLayoutRaw) {
		throw new Error('GlobalLayout konnte nicht geladen werden.')
	}

	const hzdSetting = extractStrapiSingle<GlobalLayout['HzdSetting']>(hzdSettingResponse)
	const announcements = extractStrapiList<NonNullable<GlobalLayout['announcements']>[number]>(
		announcementsResponse,
	)

	return {
		globalLayout: mergeLayoutPayload(globalLayoutRaw, hzdSetting, announcements),
		hzdSetting: hzdSetting ?? undefined,
		announcements,
	}
}

export async function fetchLayoutServer(
	baseUrl?: string | null,
	token?: string | null,
): Promise<LayoutData> {
	return fetchLayoutPayload(fetchStrapiServer, baseUrl, token)
}

export async function fetchLayoutClient(
	baseUrl?: string | null,
	token?: string | null,
): Promise<LayoutData> {
	return fetchLayoutPayload(
		(path, query, options) => fetchStrapi(path, query, {
			baseUrl: options?.baseUrl ?? baseUrl,
			token: options?.token ?? token,
			method: options?.method,
			body: options?.body,
		}),
		baseUrl,
		token,
	)
}

export async function fetchMe(
	token?: string | null,
	options: { server?: boolean; baseUrl?: string | null } = {},
): Promise<{ me: AuthUser | null }> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher(
		'users/me',
		new URLSearchParams({
			'populate[role]': '*',
			'populate[member][populate]': '*',
		}),
		{ token, baseUrl: options.baseUrl },
	)

	return {
		me: extractStrapiSingle<AuthUser>(response),
	}
}

export async function fetchPagesBySlug(
	slug: string,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<{ pages: Page[] }> {
	const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`
	const query = buildStrapiQuery({
		filters: { slug: { eq: normalizedSlug } },
		pagination: { pageSize: 1 },
		populate: Object.fromEntries(POPULATE_PAGE_SECTIONS.entries()),
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('pages', query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	const pages = extractStrapiList<Page>(response).map((page) => (
		normalizePage(page as Record<string, unknown>) as Page
	))

	return { pages }
}

export async function searchDogs(
	variables: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
		lat?: number
		lng?: number
		maxDistance?: number
	},
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<DogSearchResult> {
	const query = buildStrapiQuery({
		filters: variables.filters,
		pagination: variables.pagination,
		sort: variables.sort,
		populate: Object.fromEntries(POPULATE_DOG_SEARCH.entries()),
	})

	if (variables.lat !== undefined && variables.lng !== undefined) {
		query.set('lat', String(variables.lat))
		query.set('lng', String(variables.lng))
		if (variables.maxDistance !== undefined) {
			query.set('maxDistance', String(variables.maxDistance))
		}
	}

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/dogs', query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	const items = extractStrapiList<Dog>(response)
	const pagination = extractStrapiPagination(response)
	const connection = toConnectionResult({ items, pagination })

	return {
		hzdPluginDogs_connection: connection,
	}
}

/** Züchter-cIds mit „keine Hunde in Zucht“ — für cBreederId-Filter (Relation-Filter auf breeder schlägt fehl). */
export async function fetchBreederCIdsWithNoDogsAvailable(
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<number[]> {
	const query = buildStrapiQuery({
		filters: { HasNoDogsAvailabe: { eq: true } },
		fields: ['cId'],
		pagination: { pageSize: 500 },
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/breeders', query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	return extractStrapiList<Breeder>(response)
		.map((breeder) => breeder.cId)
		.filter((cId): cId is number => typeof cId === 'number')
}

export async function searchBreeders(
	variables: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
		lat?: number
		lng?: number
		maxDistance?: number
	},
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<BreederSearchResult> {
	const query = buildStrapiQuery({
		filters: variables.filters,
		pagination: variables.pagination,
		sort: variables.sort,
		populate: Object.fromEntries(POPULATE_BREEDER_SEARCH.entries()),
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/breeders', query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	const items = extractStrapiList<Breeder>(response)
	const pagination = extractStrapiPagination(response)

	return {
		hzdPluginBreeders_connection: toConnectionResult({
			items,
			pagination,
		}),
	}
}

export async function getBreederByDocumentId(
	documentId: string,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null; enriched?: boolean } = {},
): Promise<Breeder | null> {
	if (options.enriched !== false && !options.server) {
		const response = await fetch(`/api/breeders/${documentId}`, {
			cache: 'no-store',
		})

		if (!response.ok) {
			return null
		}

		const payload = await response.json() as { data?: Breeder }
		return payload.data ?? null
	}

	const query = buildStrapiQuery({
		populate: Object.fromEntries(POPULATE_BREEDER_SEARCH.entries()),
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>(`hzd-plugin/breeders/${documentId}`, query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	let breeder = extractStrapiSingle<Breeder>(response)

	if (
		breeder
		&& options.server
		&& options.enriched !== false
		&& !breeder.member?.documentId
		&& !(breeder.owner_members?.length)
		&& typeof breeder.cId === 'number'
		&& options.token
	) {
		const userQuery = new URLSearchParams({
			'filters[cId][$eq]': String(breeder.cId),
			'fields[0]': 'documentId',
			'fields[1]': 'cId',
			'fields[2]': 'firstName',
			'fields[3]': 'lastName',
			'fields[4]': 'region',
			'fields[5]': 'phone',
			'fields[6]': 'email',
			'fields[7]': 'city',
			'fields[8]': 'address1',
			'fields[9]': 'address2',
			'fields[10]': 'zip',
			'fields[11]': 'countryCode',
			'fields[12]': 'locationLat',
			'fields[13]': 'locationLng',
			'fields[14]': 'publishMyData',
		})

		const usersResponse = await fetchStrapiServer<unknown>(
			`users?${userQuery.toString()}`,
			undefined,
			{ token: options.token },
		)

		const users = Array.isArray(usersResponse)
			? usersResponse
			: Array.isArray((usersResponse as { data?: unknown[] })?.data)
				? (usersResponse as { data: Record<string, unknown>[] }).data
				: []

		const member = users[0] as (Breeder['member'] & { publishMyData?: boolean | null })
		if (member && member.publishMyData !== false) {
			breeder = {
				...breeder,
				member: breeder.member ?? member,
				owner_members: breeder.owner_members?.length
					? breeder.owner_members
					: member
						? [member as NonNullable<Breeder['owner_members']>[number]]
						: breeder.owner_members,
			}
		}
	}

	return breeder
}

export async function searchLitters(
	variables: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
	},
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<LitterSearchResult> {
	const query = buildStrapiQuery({
		filters: variables.filters,
		pagination: variables.pagination,
		sort: variables.sort,
		populate: Object.fromEntries(POPULATE_LITTER_SEARCH.entries()),
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/litters', query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})

	const items = extractStrapiList<Litter>(response)
	const pagination = extractStrapiPagination(response)

	return {
		hzdPluginLitters_connection: toConnectionResult({
			items,
			pagination,
		}),
	}
}

export async function fetchEntityList<T>(
	path: string,
	query: URLSearchParams,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<T[]> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>(path, query, {
		token: options.token,
		baseUrl: options.baseUrl,
	})
	return extractStrapiList<T>(response)
}

export async function fetchEntityByDocumentId<T>(
	path: string,
	documentId: string,
	populate: URLSearchParams,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<T | null> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	try {
		const response = await fetcher<unknown>(`${path}/${documentId}`, populate, {
			token: options.token,
			baseUrl: options.baseUrl,
		})
		return extractStrapiSingle<T>(response)
	} catch {
		const query = buildStrapiQuery({
			filters: { documentId: { eq: documentId } },
			pagination: { pageSize: 1 },
			populate: Object.fromEntries(populate.entries()),
		})
		const listResponse = await fetcher<unknown>(path, query, {
			token: options.token,
			baseUrl: options.baseUrl,
		})
		return extractStrapiList<T>(listResponse)[0] ?? null
	}
}

export async function createEntity<T>(
	path: string,
	data: Record<string, unknown>,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<T> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<{ data: T }>(path, undefined, {
		method: 'POST',
		body: { data },
		token: options.token,
		baseUrl: options.baseUrl,
	})
	return extractStrapiSingle<T>(response) as T
}

export async function updateEntity<T>(
	path: string,
	documentId: string,
	data: Record<string, unknown>,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<T> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<{ data: T }>(`${path}/${documentId}`, undefined, {
		method: 'PUT',
		body: { data },
		token: options.token,
		baseUrl: options.baseUrl,
	})
	return extractStrapiSingle<T>(response) as T
}

export async function deleteEntity(
	path: string,
	documentId: string,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
): Promise<void> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	await fetcher(`${path}/${documentId}`, undefined, {
		method: 'DELETE',
		token: options.token,
		baseUrl: options.baseUrl,
	})
}

export async function fetchFormByDocumentId(
	documentId: string,
	options: { server?: boolean; baseUrl?: string | null } = {},
) {
	const form = await fetchEntityByDocumentId<Record<string, unknown>>(
		'forms',
		documentId,
		POPULATE_FORM,
		options,
	)

	if (!form) {
		return { forms: [] }
	}

	return {
		forms: [{
			...form,
			FormFields: normalizeFormFields(form.FormFields),
		}],
	}
}

export async function fetchContactByDocumentId(
	documentId: string,
	options: { server?: boolean; baseUrl?: string | null } = {},
) {
	const contact = await fetchEntityByDocumentId<Record<string, unknown>>(
		'contacts',
		documentId,
		POPULATE_CONTACT,
		options,
	)
	return { contact }
}

export async function countFormInstances(
	filters?: FilterValue,
	options: { server?: boolean; baseUrl?: string | null; token?: string | null } = {},
) {
	const query = buildStrapiQuery({
		filters,
		pagination: { pageSize: 500 },
		fields: ['documentId', 'Content', 'createdAt', 'updatedAt'],
	})
	const items = await fetchEntityList<{
		documentId: string
		Content?: unknown
		createdAt?: string
		updatedAt?: string
	}>(
		'form-instances',
		query,
		options,
	)
	return { formInstances: items }
}

export async function createFormInstance(
	data: { form: string; Content: unknown },
	options: { server?: boolean; baseUrl?: string | null } = {},
): Promise<FormInstance> {
	return createEntity<FormInstance>('form-instances', data, options)
}

export async function changePassword(
	variables: {
		currentPassword: string
		password: string
		passwordConfirmation: string
	},
	token?: string | null,
) {
	return fetchStrapi('auth/change-password', undefined, {
		method: 'POST',
		body: variables,
		token,
	})
}

export async function fetchSitemapData(
	baseUrl?: string | null,
): Promise<{
	indexPage: { updatedAt: string }
	pages: { slug: string; updatedAt: string }[]
	newsArticles: { Slug: string; updatedAt: string }[]
	newsArticleCategories: { Slug: string; updatedAt: string }[]
	hzdPluginDogs: { updatedAt: string }[]
	hzdPluginBreeders: { updatedAt: string }[]
	hzdPluginLitters: { updatedAt: string }[]
	calendarEntries: { updatedAt: string }[]
}> {
	const limitQuery = buildStrapiQuery({ pagination: { limit: -1 } })
	const oneQuery = buildStrapiQuery({
		pagination: { pageSize: 1 },
		sort: 'updatedAt:desc',
	})

	const [
		layoutData,
		pages,
		newsArticles,
		newsArticleCategories,
		dogs,
		breeders,
		litters,
		calendarEntries,
	] = await Promise.all([
		fetchLayoutServer(baseUrl),
		fetchEntityList<{ slug: string; updatedAt: string }>('pages', limitQuery, { server: true, baseUrl }),
		fetchEntityList<{ Slug: string; updatedAt: string }>('news-articles', limitQuery, { server: true, baseUrl }),
		fetchEntityList<{ Slug: string; updatedAt: string }>('news-article-categories', limitQuery, { server: true, baseUrl }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/dogs', oneQuery, { server: true, baseUrl }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/breeders', oneQuery, { server: true, baseUrl }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/litters', oneQuery, { server: true, baseUrl }),
		fetchEntityList<{ updatedAt: string }>('calendar-entries', oneQuery, { server: true, baseUrl }),
	])

	const indexUpdated = (layoutData.globalLayout.page as { updatedAt?: string } | null | undefined)?.updatedAt
		|| (layoutData.globalLayout as { updatedAt?: string }).updatedAt
		|| new Date().toISOString()

	return {
		indexPage: { updatedAt: indexUpdated },
		pages,
		newsArticles,
		newsArticleCategories,
		hzdPluginDogs: dogs,
		hzdPluginBreeders: breeders,
		hzdPluginLitters: litters,
		calendarEntries,
	}
}

export async function fetchApprovedPassedDogsPage(
	page: number,
	pageSize: number,
	baseUrl?: string | null,
) {
	const query = buildStrapiQuery({
		filters: {
			and: [
				{ Approved: { eq: true } },
				{ Consent: { eq: true } },
			],
		},
		pagination: { page, pageSize },
		sort: ['DatePassed:desc', 'publishedAt:desc'],
		populate: Object.fromEntries(POPULATE_PASSED_DOG.entries()),
	})

	const response = await fetchStrapiServer<unknown>('passed-dogs', query)
	const nodes = extractStrapiList(response)
	const pagination = extractStrapiPagination(response)

	return {
		nodes,
		pageInfo: toConnectionResult({ items: nodes, pagination }).pageInfo,
	}
}

export async function fetchSupplementalDocumentGroup(
	documentId: string,
	baseUrl?: string | null,
) {
	const populate = new URLSearchParams({
		'populate[supplemental_documents][populate][DownloadDocument]': 'true',
	})
	return fetchEntityByDocumentId<Record<string, unknown>>(
		'supplemental-document-groups',
		documentId,
		populate,
		{ server: true, baseUrl },
	)
}

export async function fetchSupplementalDocumentsForGroup(
	groupDocumentId: string,
	baseUrl?: string | null,
) {
	const query = buildStrapiQuery({
		filters: {
			supplemental_document_groups: {
				documentId: { eq: groupDocumentId },
			},
		},
		pagination: { pageSize: 500 },
		populate: Object.fromEntries(POPULATE_SUPPLEMENTAL_DOCUMENT.entries()),
	})
	return fetchEntityList<Record<string, unknown>>(
		'supplemental-documents',
		query,
		{ server: true, baseUrl },
	)
}

export async function fetchNewsArticleBySlug(
	slug: string,
	baseUrl?: string | null,
) {
	const query = buildStrapiQuery({
		filters: { Slug: { eq: slug } },
		pagination: { pageSize: 1 },
		populate: Object.fromEntries(POPULATE_NEWS_ARTICLE.entries()),
	})
	const items = await fetchEntityList<Record<string, unknown>>(
		'news-articles',
		query,
		{ server: true, baseUrl },
	)
	const article = items[0]
	if (!article) {
		return { newsArticles: [] }
	}

	return {
		newsArticles: [{
			...article,
			NewsContentSections: normalizeSections(article.NewsContentSections),
		}],
	}
}

export async function fetchNewsArticles(
	options: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
		baseUrl?: string | null
	} = {},
) {
	const query = buildStrapiQuery({
		filters: options.filters,
		pagination: options.pagination,
		sort: options.sort,
		populate: Object.fromEntries(POPULATE_NEWS_ARTICLE.entries()),
	})
	const items = await fetchEntityList<Record<string, unknown>>(
		'news-articles',
		query,
		{ server: true, baseUrl: options.baseUrl },
	)
	return { newsArticles: items }
}

export async function fetchMyPhotoboxCollections(
	token: string,
	baseUrl?: string | null,
) {
	const query = buildStrapiQuery({
		populate: Object.fromEntries(POPULATE_PHOTOBOX_COLLECTION.entries()),
		pagination: { pageSize: 100 },
	})
	const items = await fetchEntityList<Record<string, unknown>>(
		'photobox-image-collections',
		query,
		{ token, baseUrl },
	)
	return { photoboxImageCollections: items }
}
