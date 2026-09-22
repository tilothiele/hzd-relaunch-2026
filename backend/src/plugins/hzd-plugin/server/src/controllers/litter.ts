/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'

const VALID_STATUSES = ['Planned', 'Manted', 'Littered', 'Closed'] as const
const VALID_PUPPY_COLORS = ['S', 'SM', 'B'] as const

type LitterStatus = (typeof VALID_STATUSES)[number]
type PuppyColor = (typeof VALID_PUPPY_COLORS)[number]

interface LitterSearchQuery {
  breeder?: string
  breederDocumentId?: string
  mother?: string
  status?: string
  orderLetter?: string
  maleColors?: string | string[]
  femaleColors?: string | string[]
  page?: string | number
  pageSize?: string | number
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : [])).map((entry) => entry.trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }
  return []
}

const parsePagination = (query: LitterSearchQuery): { page: number; pageSize: number } => {
  const parsePage = (raw: unknown, fallback: number): number => {
    if (typeof raw !== 'string' && typeof raw !== 'number') return fallback
    const parsed = Number.parseInt(String(raw), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  return {
    page: parsePage(query.page, 1),
    pageSize: parsePage(query.pageSize, 10),
  }
}

const toFilterConditions = (query: LitterSearchQuery): Array<Record<string, unknown>> => {
  const conditions: Array<Record<string, unknown>> = []
  const breeder = typeof query.breeder === 'string' ? query.breeder.trim() : ''
  const mother = typeof query.mother === 'string' ? query.mother.trim() : ''
  const status = typeof query.status === 'string' ? query.status.trim() : ''
  const orderLetter = typeof query.orderLetter === 'string' ? query.orderLetter.trim() : ''

  if (breeder.length > 0) {
    conditions.push({
      breeder: {
        kennelName: { $containsi: breeder },
      },
    })
  }

  const breederDocumentId =
    typeof query.breederDocumentId === 'string' ? query.breederDocumentId.trim() : ''
  if (breederDocumentId.length > 0) {
    conditions.push({
      breeder: {
        documentId: { $eq: breederDocumentId },
      },
    })
  }

  if (mother.length > 0) {
    conditions.push({
      $or: [
        { mother: { fullKennelName: { $containsi: mother } } },
        { mother: { givenName: { $containsi: mother } } },
      ],
    })
  }

  if (status.length > 0 && (VALID_STATUSES as readonly string[]).includes(status)) {
    conditions.push({
      LitterStatus: { $eq: status as LitterStatus },
    })
  }

  if (orderLetter.length > 0) {
    conditions.push({
      OrderLetter: { $eq: orderLetter },
    })
  }

  if (status === 'Littered') {
    const maleColors = toStringArray(query.maleColors).filter(
      (color): color is PuppyColor => (VALID_PUPPY_COLORS as readonly string[]).includes(color),
    )
    const femaleColors = toStringArray(query.femaleColors).filter(
      (color): color is PuppyColor => (VALID_PUPPY_COLORS as readonly string[]).includes(color),
    )

    if (maleColors.length > 0) {
      conditions.push({
        $or: maleColors.map((color) => ({
          [`AmountR${color}`]: { Available: { $gt: 0 } },
        })),
      })
    }

    if (femaleColors.length > 0) {
      conditions.push({
        $or: femaleColors.map((color) => ({
          [`AmountH${color}`]: { Available: { $gt: 0 } },
        })),
      })
    }
  }

  return conditions
}

const ZUECHTER_GROUP_ID = '4'
const ORDER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const emptyPuppyAmount = () => ({ Total: 0, Available: 0 })

const readDocumentId = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  const record = value as Record<string, unknown>
  if (typeof record.documentId === 'string') {
    return record.documentId.trim()
  }

  if (typeof record.id === 'string') {
    return record.id.trim()
  }

  return ''
}

const userIsZuechter = (user: { user_groups?: unknown }): boolean => {
  const groups = Array.isArray(user.user_groups) ? user.user_groups : []

  return groups.some((group) => {
    if (!group || typeof group !== 'object') {
      return false
    }

    const record = group as Record<string, unknown>
    if (String(record.id ?? '') === ZUECHTER_GROUP_ID) {
      return true
    }

    const name = typeof record.Name === 'string'
      ? record.Name.trim().toLowerCase()
      : ''

    return name === 'züchter' || name === 'zuechter'
  })
}

const userOwnsBreeder = (
  user: { id?: number | string | null; documentId?: string | null },
  breeder: { owner_members?: unknown; member?: unknown } | null,
): boolean => {
  if (!breeder) {
    return false
  }

  const ids = new Set<string>()
  if (user.id != null) {
    ids.add(String(user.id))
  }
  if (user.documentId) {
    ids.add(String(user.documentId))
  }

  const members = [
    ...(Array.isArray(breeder.owner_members) ? breeder.owner_members : []),
    breeder.member,
  ]

  return members.some((member) => {
    if (!member || typeof member !== 'object') {
      return false
    }

    const record = member as Record<string, unknown>
    return ids.has(String(record.id ?? ''))
      || (typeof record.documentId === 'string' && ids.has(record.documentId))
  })
}

async function loadUserFromRequest(strapi: Core.Strapi, ctx: any) {
  const jwtService = strapi.plugin('users-permissions')?.service('jwt')
  if (!jwtService?.getToken) {
    return null
  }

  try {
    const payload = await jwtService.getToken(ctx)
    const userId = payload?.id
    if (userId == null) {
      return null
    }

    return strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { user_groups: true },
    })
  } catch {
    return null
  }
}

async function findOwnedBreeder(
  strapi: Core.Strapi,
  breederDocumentId: string,
) {
  return strapi.documents('plugin::hzd-plugin.breeder').findOne({
    documentId: breederDocumentId,
    populate: {
      owner_members: true,
      member: true,
    },
  })
}

async function nextOrderLetter(
  strapi: Core.Strapi,
  breederDocumentId: string,
): Promise<string | null> {
  const litters = await strapi.documents('plugin::hzd-plugin.litter').findMany({
    filters: {
      breeder: {
        documentId: breederDocumentId,
      },
    },
    fields: ['OrderLetter'],
  })

  const used = new Set(
    (litters ?? []).map((litter) =>
      String(litter.OrderLetter ?? '').trim().toUpperCase(),
    ),
  )

  return ORDER_LETTERS.split('').find((letter) => !used.has(letter)) ?? null
}

const LITTERED_FIRST_POPULATE = {
  breeder: {
    fields: ['documentId', 'kennelName', 'WebsiteUrl'],
    populate: {
      member: {
        fields: ['documentId', 'firstName', 'lastName', 'zip', 'city', 'locationLat', 'locationLng'],
      },
    },
  },
  mother: {
    fields: ['documentId', 'fullKennelName', 'givenName', 'color'],
    populate: { avatar: true },
  },
  stuntDog: {
    fields: ['documentId', 'fullKennelName', 'givenName', 'color', 'NonHzdOriginNote'],
    populate: { avatar: true },
  },
  PuppyImage: true,
  AmountRS: true,
  AmountRSM: true,
  AmountRB: true,
  AmountHS: true,
  AmountHSM: true,
  AmountHB: true,
}

const coreControllerFactory = factories.createCoreController(
  'plugin::hzd-plugin.litter',
  ({ strapi }: { strapi: Core.Strapi }) => ({
    async create(ctx: any) {
      const user = await loadUserFromRequest(strapi, ctx)
      if (!user) {
        return ctx.unauthorized('Nicht authentifiziert')
      }

      if (!userIsZuechter(user)) {
        return ctx.forbidden('Nur Züchter können einen Wurf anlegen.')
      }

      const payload = ctx.request.body?.data ?? {}
      const breederDocumentId = readDocumentId(payload.breeder)
      if (!breederDocumentId) {
        return ctx.badRequest('Zwinger fehlt.')
      }

      const breeder = await findOwnedBreeder(strapi, breederDocumentId)
      if (!breeder) {
        return ctx.notFound('Zwinger nicht gefunden.')
      }

      if (!userOwnsBreeder(user, breeder)) {
        return ctx.forbidden(
          'Der Wurf kann nur für den eigenen Zwinger angelegt werden.',
        )
      }

      const orderLetter = await nextOrderLetter(strapi, breederDocumentId)
      if (!orderLetter) {
        return ctx.badRequest(
          'Für diesen Zwinger sind alle Wurfbuchstaben vergeben.',
        )
      }

      const entity = await strapi.documents('plugin::hzd-plugin.litter').create({
        data: {
          LitterStatus: 'Planned',
          OrderLetter: orderLetter,
          breeder: breederDocumentId,
          AmountRS: emptyPuppyAmount(),
          AmountRSM: emptyPuppyAmount(),
          AmountRB: emptyPuppyAmount(),
          AmountHS: emptyPuppyAmount(),
          AmountHSM: emptyPuppyAmount(),
          AmountHB: emptyPuppyAmount(),
        },
        populate: LITTERED_FIRST_POPULATE,
      })

      ctx.status = 201
      return { data: entity }
    },

    async update(ctx: any) {
      const user = await loadUserFromRequest(strapi, ctx)
      if (!user) {
        return ctx.unauthorized('Nicht authentifiziert')
      }

      if (!userIsZuechter(user)) {
        return ctx.forbidden('Nur Züchter können einen Wurf bearbeiten.')
      }

      const documentId = typeof ctx.params?.id === 'string' ? ctx.params.id : ''
      const litter = documentId
        ? await strapi.documents('plugin::hzd-plugin.litter').findOne({
          documentId,
          populate: {
            breeder: {
              populate: {
                owner_members: true,
                member: true,
              },
            },
          },
        })
        : null

      if (!litter?.breeder) {
        return ctx.notFound('Wurf nicht gefunden.')
      }

      if (!userOwnsBreeder(user, litter.breeder)) {
        return ctx.forbidden('Dieser Wurf gehört nicht zum eigenen Zwinger.')
      }

      const input = ctx.request.body?.data as Record<string, unknown> | undefined
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return ctx.badRequest('Missing "data" payload in the request body')
      }

      const data: Record<string, unknown> = {}
      const editableFields = [
        'LitterStatus',
        'StatusMessageDraft',
        'OrderLetter',
        'mother',
        'stuntDog',
        'plannedDateOfBirth',
        'expectedDateOfBirth',
        'dateOfBirth',
        'AmountRS',
        'AmountRSM',
        'AmountRB',
        'AmountHS',
        'AmountHSM',
        'AmountHB',
      ] as const

      for (const field of editableFields) {
        if (!(field in input)) {
          continue
        }

        if (field === 'mother' || field === 'stuntDog') {
          const relation = input[field]
          data[field] = typeof relation === 'string' && relation.trim()
            ? relation.trim()
            : null
          continue
        }

        data[field] = input[field]
      }

      const entity = await strapi.documents('plugin::hzd-plugin.litter').update({
        documentId,
        data,
        populate: LITTERED_FIRST_POPULATE,
      })

      return { data: entity }
    },

    async search(ctx: any) {
      const rawQuery = (ctx?.query ?? {}) as LitterSearchQuery
      const filterConditions = toFilterConditions(rawQuery)
      const { page, pageSize } = parsePagination(rawQuery)

      const sortRaw = (rawQuery as Record<string, unknown>).sort
      const sortList: string[] =
        typeof sortRaw === 'string'
          ? sortRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(sortRaw)
            ? sortRaw.filter((s): s is string => typeof s === 'string').filter(Boolean)
            : []

      if (sortList.length > 0) {
        const result = await findDocumentsPage(
          strapi,
          'plugin::hzd-plugin.litter',
          {
            populate: LITTERED_FIRST_POPULATE,
            sort: sortList,
            page,
            pageSize,
            filters: filterConditions.length > 0
              ? { $and: filterConditions }
              : undefined,
          },
        )
        return {
          data: result.results,
          meta: { pagination: result.pagination },
        }
      }

      const [litteredResult, otherResult] = await Promise.all([
        findDocumentsPage(
          strapi,
          'plugin::hzd-plugin.litter',
          {
            populate: LITTERED_FIRST_POPULATE,
            sort: ['dateOfBirth:asc', 'expectedDateOfBirth:asc'],
            page: 1,
            pageSize: 10000,
            filters: filterConditions.length > 0
              ? { $and: [...filterConditions, { LitterStatus: { $eq: 'Littered' } }] }
              : { LitterStatus: { $eq: 'Littered' } },
          },
        ),
        findDocumentsPage(
          strapi,
          'plugin::hzd-plugin.litter',
          {
            populate: LITTERED_FIRST_POPULATE,
            sort: ['expectedDateOfBirth:asc', 'plannedDateOfBirth:asc'],
            page: 1,
            pageSize: 10000,
            filters: filterConditions.length > 0
              ? { $and: [...filterConditions, { LitterStatus: { $ne: 'Littered' } }] }
              : { LitterStatus: { $ne: 'Littered' } },
          },
        ),
      ])

      const merged = [...litteredResult.results, ...otherResult.results]

      const total = merged.length
      const start = (page - 1) * pageSize
      const paged = merged.slice(start, start + pageSize)

      return {
        data: paged,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.max(1, Math.ceil(total / pageSize)),
            total,
          },
        },
      }
    },
  }),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })