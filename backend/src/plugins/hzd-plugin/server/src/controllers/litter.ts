/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyController = Record<string, any>

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

const coreControllerFactory = factories.createCoreController(
  'plugin::hzd-plugin.litter',
  ({ strapi }: { strapi: Core.Strapi }) => ({
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
      const sort = sortList.length > 0 ? sortList : ['dateOfBirth:desc', 'expectedDateOfBirth:desc']

      const result = await findDocumentsPage(
        strapi,
        'plugin::hzd-plugin.litter',
        {
          populate: {
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
              fields: ['documentId', 'fullKennelName', 'givenName', 'color'],
              populate: { avatar: true },
            },
            AmountRS: true,
            AmountRSM: true,
            AmountRB: true,
            AmountHS: true,
            AmountHSM: true,
            AmountHB: true,
          },
          sort,
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
    },
  }),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })