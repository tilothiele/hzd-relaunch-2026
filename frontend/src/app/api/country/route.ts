
import { NextRequest, NextResponse } from 'next/server'
import { getIso3166_1_CountryCodeByCountry } from '@/lib/server/country-utils'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') ?? ''

    const countries = getIso3166_1_CountryCodeByCountry(search)

    return NextResponse.json(countries)
}
