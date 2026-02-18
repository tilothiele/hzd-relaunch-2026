'use server'

import { fetchChampions } from './champion-utils'

export async function getMoreChampions(page: number, pageSize: number) {
    return await fetchChampions(page, pageSize)
}
