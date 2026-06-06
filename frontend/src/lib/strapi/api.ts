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
	POPULATE_FORM,
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
	Champion,
	ChampionSearchPageResult,
	ChampionSearchParams,
	Dog,
	DogSearchResult,
	FormInstance,
	GlobalLayout,
	Litter,
	LitterSearchResult,
	Page,
} from '@/types'

type FilterValue = Record<string, unknown>

export interface StrapiRequestOptions {
	server?: boolean
	token?: string | null
}

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
	options?: { token?: string | null; method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown },
) => Promise<unknown>

async function fetchLayoutPayload(
	fetcher: StrapiFetcher,
	token?: string | null,
): Promise<LayoutData> {
	const [layoutResponse, hzdSettingResponse, announcementsResponse] = await Promise.all([
		fetcher('global-layout', undefined, { token }),
		fetcher('hzd-setting', new URLSearchParams({ populate: '*' }), { token }),
		fetcher(
			'announcements',
			buildStrapiQuery({
				pagination: { pageSize: 100 },
				sort: 'createdAt:desc',
			}),
			{ token },
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
	token?: string | null,
): Promise<LayoutData> {
	return fetchLayoutPayload(fetchStrapiServer, token)
}

export async function fetchLayoutClient(
	token?: string | null,
): Promise<LayoutData> {
	return fetchLayoutPayload(
		(path, query, options) => fetchStrapi(path, query, {
			token: options?.token ?? token,
			method: options?.method,
			body: options?.body,
		}),
		token,
	)
}

export async function fetchMe(
	token?: string | null,
	options: StrapiRequestOptions = {},
): Promise<{ me: AuthUser | null }> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher(
		'users/me',
		new URLSearchParams({
			'populate[role]': '*',
			'populate[member][populate]': '*',
		}),
		{ token },
	)

	return {
		me: extractStrapiSingle<AuthUser>(response),
	}
}

export async function fetchPagesBySlug(
	slug: string,
	options: StrapiRequestOptions = {},
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
	})

	const pages = extractStrapiList<Page>(response).map((page) => (
		normalizePage(page as Record<string, unknown>) as Page
	))

	return { pages }
}

export interface DogSearchParams {
	name?: string
	sex?: string
	color?: string
	hd?: string
	sod1?: string
	eyesCheck?: string
	heartCheck?: string
	colorCheck?: string
	ownerCIds?: number[]
	cBreederId?: number
	maxAge?: number
	lat?: number
	lng?: number
	maxDistance?: number
	sort?: string | string[]
	page?: number
	pageSize?: number
}

export async function searchDogs(
	params: DogSearchParams,
	options: StrapiRequestOptions = {},
): Promise<DogSearchResult> {
	const query = new URLSearchParams()

	if (params.name?.trim()) query.set('name', params.name.trim())
	if (params.sex?.trim()) query.set('sex', params.sex.trim())
	if (params.color?.trim()) query.set('color', params.color.trim())
	if (params.hd?.trim()) query.set('hd', params.hd.trim())
	if (params.sod1?.trim()) query.set('sod1', params.sod1.trim())
	if (params.eyesCheck) query.set('eyesCheck', params.eyesCheck)
	if (params.heartCheck) query.set('heartCheck', params.heartCheck)
	if (params.colorCheck) query.set('colorCheck', params.colorCheck)
	if (params.ownerCIds && params.ownerCIds.length > 0) {
		query.set('ownerCIds', params.ownerCIds.join(','))
	}
	if (typeof params.cBreederId === 'number') {
		query.set('cBreederId', String(params.cBreederId))
	}
	if (typeof params.maxAge === 'number' && params.maxAge > 0) {
		query.set('maxAge', String(params.maxAge))
	}
	if (typeof params.lat === 'number' && typeof params.lng === 'number') {
		query.set('lat', String(params.lat))
		query.set('lng', String(params.lng))
		if (typeof params.maxDistance === 'number') {
			query.set('maxDistance', String(params.maxDistance))
		}
	}
	if (params.sort) {
		const sortValue = Array.isArray(params.sort) ? params.sort.join(',') : params.sort
		if (sortValue.trim().length > 0) query.set('sort', sortValue)
	}
	if (params.page !== undefined) query.set('page', String(params.page))
	if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/dogs/search', query, {
		token: options.token,
	})

	const items = extractStrapiList<Dog>(response)
	const pagination = extractStrapiPagination(response)

	return {
		hzdPluginDogs_connection: toConnectionResult({
			items,
			pagination,
		}),
	}
}

/** Generische Dog-Suche mit freier Filter-Syntax (für Admin/Moderator-Bereich) */
export async function searchDogsGeneric(
	variables: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
	},
	options: StrapiRequestOptions = {},
): Promise<DogSearchResult> {
	const query = buildStrapiQuery({
		filters: variables.filters,
		pagination: variables.pagination,
		sort: variables.sort,
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/dogs', query, {
		token: options.token,
	})

	const items = extractStrapiList<Dog>(response)
	const pagination = extractStrapiPagination(response)

	return {
		hzdPluginDogs_connection: toConnectionResult({
			items,
			pagination,
		}),
	}
}

/** Züchter-cIds mit „keine Hunde in Zucht“ — für cBreederId-Filter (Relation-Filter auf breeder schlägt fehl). */
export async function fetchBreederCIdsWithNoDogsAvailable(
	options: StrapiRequestOptions = {},
): Promise<number[]> {
	const query = buildStrapiQuery({
		filters: { HasNoDogsAvailabe: { eq: true } },
		fields: ['cId'],
		pagination: { pageSize: 500 },
	})

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/breeders', query, {
		token: options.token,
	})

	return extractStrapiList<Breeder>(response)
		.map((breeder) => breeder.cId)
		.filter((cId): cId is number => typeof cId === 'number')
}

export interface BreederSearchParams {
	name?: string
	breederRole?: 'B' | 'S'
	ownerMemberDocumentId?: string
	sort?: string | string[]
	page?: number
	pageSize?: number
}

export async function searchBreeders(
	params: BreederSearchParams,
	options: StrapiRequestOptions = {},
): Promise<BreederSearchResult> {
	const query = new URLSearchParams()

	if (params.name?.trim()) query.set('name', params.name.trim())
	if (params.breederRole) query.set('breederRole', params.breederRole)
	if (params.ownerMemberDocumentId?.trim()) {
		query.set('ownerMemberDocumentId', params.ownerMemberDocumentId.trim())
	}
	if (params.sort) {
		const sortValue = Array.isArray(params.sort) ? params.sort.join(',') : params.sort
		if (sortValue.trim().length > 0) query.set('sort', sortValue)
	}
	if (params.page !== undefined) query.set('page', String(params.page))
	if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/breeders/search', query, {
		token: options.token,
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

/** Generische Breeder-Suche mit freier Filter-Syntax */
export async function searchBreedersGeneric(
	variables: {
		filters?: FilterValue
		pagination?: { page?: number; pageSize?: number; limit?: number }
		sort?: string | string[]
	},
	options: StrapiRequestOptions = {},
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
	options: StrapiRequestOptions & { enriched?: boolean } = {},
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
			'fields[6]': 'cEmail',
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

export interface LitterSearchParams {
	breeder?: string
	breederDocumentId?: string
	mother?: string
	status?: string
	orderLetter?: string
	maleColors?: string[]
	femaleColors?: string[]
	sort?: string | string[]
	page?: number
	pageSize?: number
}

export async function searchLitters(
	params: LitterSearchParams,
	options: StrapiRequestOptions = {},
): Promise<LitterSearchResult> {
	const query = new URLSearchParams()

	if (params.breeder?.trim()) query.set('breeder', params.breeder.trim())
	if (params.breederDocumentId?.trim()) query.set('breederDocumentId', params.breederDocumentId.trim())
	if (params.mother?.trim()) query.set('mother', params.mother.trim())
	if (params.status?.trim()) query.set('status', params.status.trim())
	if (params.orderLetter?.trim()) query.set('orderLetter', params.orderLetter.trim())
	if (params.maleColors && params.maleColors.length > 0) {
		query.set('maleColors', params.maleColors.join(','))
	}
	if (params.femaleColors && params.femaleColors.length > 0) {
		query.set('femaleColors', params.femaleColors.join(','))
	}
	if (params.sort) {
		const sortValue = Array.isArray(params.sort) ? params.sort.join(',') : params.sort
		if (sortValue.trim().length > 0) query.set('sort', sortValue)
	}
	if (params.page !== undefined) query.set('page', String(params.page))
	if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('hzd-plugin/litters/search', query, {
		token: options.token,
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
	options: StrapiRequestOptions = {},
): Promise<T[]> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>(path, query, {
		token: options.token,
	})
	return extractStrapiList<T>(response)
}

export async function fetchEntityByDocumentId<T>(
	path: string,
	documentId: string,
	populate: URLSearchParams,
	options: StrapiRequestOptions = {},
): Promise<T | null> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	try {
		const response = await fetcher<unknown>(`${path}/${documentId}`, populate, {
		token: options.token,
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
	})
		return extractStrapiList<T>(listResponse)[0] ?? null
	}
}

export async function createEntity<T>(
	path: string,
	data: Record<string, unknown>,
	options: StrapiRequestOptions = {},
): Promise<T> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<{ data: T }>(path, undefined, {
		method: 'POST',
		body: { data },
		token: options.token,
	})
	return extractStrapiSingle<T>(response) as T
}

export async function updateEntity<T>(
	path: string,
	documentId: string,
	data: Record<string, unknown>,
	options: StrapiRequestOptions = {},
): Promise<T> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<{ data: T }>(`${path}/${documentId}`, undefined, {
		method: 'PUT',
		body: { data },
		token: options.token,
	})
	return extractStrapiSingle<T>(response) as T
}

export async function deleteEntity(
	path: string,
	documentId: string,
	options: StrapiRequestOptions = {},
): Promise<void> {
	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	await fetcher(`${path}/${documentId}`, undefined, {
		method: 'DELETE',
		token: options.token,
	})
}

export async function fetchFormByDocumentId(
	documentId: string,
	options: StrapiRequestOptions = {},
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
	options: StrapiRequestOptions = {},
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
	options: StrapiRequestOptions = {},
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
	options: StrapiRequestOptions = {},
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

export async function fetchSitemapData(): Promise<{
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
		fetchLayoutServer(),
		fetchEntityList<{ slug: string; updatedAt: string }>('pages', limitQuery, { server: true }),
		fetchEntityList<{ Slug: string; updatedAt: string }>('news-articles', limitQuery, { server: true }),
		fetchEntityList<{ Slug: string; updatedAt: string }>('news-article-categories', limitQuery, { server: true }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/dogs', oneQuery, { server: true }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/breeders', oneQuery, { server: true }),
		fetchEntityList<{ updatedAt: string }>('hzd-plugin/litters', oneQuery, { server: true }),
		fetchEntityList<{ updatedAt: string }>('calendar-entries', oneQuery, { server: true }),
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

export async function searchChampions(
	params: ChampionSearchParams = {},
	options: StrapiRequestOptions = {},
): Promise<ChampionSearchPageResult> {
	const query = new URLSearchParams()

	if (params.sort) {
		const sortValue = Array.isArray(params.sort) ? params.sort.join(',') : params.sort
		if (sortValue.trim().length > 0) query.set('sort', sortValue)
	}
	if (params.page !== undefined) query.set('page', String(params.page))
	if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
	if (typeof params.year === 'number' && params.year > 0) {
		query.set('year', String(params.year))
	}
	if (params.dogName?.trim()) query.set('dogName', params.dogName.trim())

	const fetcher = options.server ? fetchStrapiServer : fetchStrapi
	const response = await fetcher<unknown>('champions/search', query, {
		token: options.token,
	})

	const nodes = extractStrapiList<Champion>(response)
	const pagination = extractStrapiPagination(response)

	return {
		nodes,
		pageInfo: toConnectionResult({ items: nodes, pagination }).pageInfo,
	}
}

export async function fetchApprovedPassedDogsPage(
	page: number,
	pageSize: number,
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
) {
	const populate = new URLSearchParams({
		'populate[supplemental_documents][populate][DownloadDocument]': 'true',
	})
	return fetchEntityByDocumentId<Record<string, unknown>>(
		'supplemental-document-groups',
		documentId,
		populate,
		{ server: true },
	)
}

export async function fetchSupplementalDocumentsForGroup(
	groupDocumentId: string,
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
		{ server: true },
	)
}

export async function fetchNewsArticleBySlug(
	slug: string,
) {
	const query = buildStrapiQuery({
		filters: { Slug: { eq: slug } },
		pagination: { pageSize: 1 },
		populate: Object.fromEntries(POPULATE_NEWS_ARTICLE.entries()),
	})
	const items = await fetchEntityList<Record<string, unknown>>(
		'news-articles',
		query,
		{ server: true },
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
		{ server: true },
	)
	return { newsArticles: items }
}

export async function fetchMyPhotoboxCollections(
	token: string,
) {
	const query = buildStrapiQuery({
		populate: Object.fromEntries(POPULATE_PHOTOBOX_COLLECTION.entries()),
		pagination: { pageSize: 100 },
	})
	const items = await fetchEntityList<Record<string, unknown>>(
		'photobox-image-collections',
		query,
		{ token },
	)
	return { photoboxImageCollections: items }
}
