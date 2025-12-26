
export interface Country {
    code: string
    name: string
}

const GERMANY: Country = { code: 'DE', name: 'Deutschland' }

const NEIGHBORS: Record<string, string> = {
    AT: 'Österreich',
    BE: 'Belgien',
    CH: 'Schweiz',
    CZ: 'Tschechische Republik',
    DK: 'Dänemark',
    FR: 'Frankreich',
    LU: 'Luxemburg',
    NL: 'Niederlande',
    PL: 'Polen',
}

const OTHER_EUROPEAN_COUNTRIES: Record<string, string> = {
    AL: 'Albanien',
    AD: 'Andorra',
    BA: 'Bosnien und Herzegowina',
    BG: 'Bulgarien',
    EE: 'Estland',
    FI: 'Finnland',
    GR: 'Griechenland',
    IE: 'Irland',
    IS: 'Island',
    IT: 'Italien',
    HR: 'Kroatien',
    LV: 'Lettland',
    LI: 'Liechtenstein',
    LT: 'Litauen',
    MT: 'Malta',
    MC: 'Monaco',
    ME: 'Montenegro',
    MK: 'Nordmazedonien',
    NO: 'Norwegen',
    PT: 'Portugal',
    RO: 'Rumänien',
    SM: 'San Marino',
    SE: 'Schweden',
    RS: 'Serbien',
    SK: 'Slowakei',
    SI: 'Slowenien',
    ES: 'Spanien',
    TR: 'Türkei', // Often included in European lists
    UA: 'Ukraine',
    HU: 'Ungarn',
    VA: 'Vatikanstadt',
    GB: 'Vereinigtes Königreich',
    BY: 'Weißrussland',
    CY: 'Zypern',
}

// Combine for lookup and list generation
const EUROPEAN_COUNTRIES_MAP = {
    [GERMANY.code]: GERMANY.name,
    ...NEIGHBORS,
    ...OTHER_EUROPEAN_COUNTRIES,
}

// Manual mapping for lookup (keys lowercase)
// Includes English and German variants
const NAME_TO_CODE_MAP: Record<string, string> = {
    // Germany
    'deutschland': 'DE',
    'germany': 'DE',
    'brd': 'DE',

    // Neighbors
    'österreich': 'AT', 'austria': 'AT',
    'belgien': 'BE', 'belgium': 'BE',
    'schweiz': 'CH', 'switzerland': 'CH',
    'tschechische republik': 'CZ', 'czech republic': 'CZ', 'tschechien': 'CZ', 'czechia': 'CZ',
    'dänemark': 'DK', 'denmark': 'DK',
    'frankreich': 'FR', 'france': 'FR',
    'luxemburg': 'LU', 'luxembourg': 'LU',
    'niederlande': 'NL', 'netherlands': 'NL', 'holland': 'NL',
    'polen': 'PL', 'poland': 'PL',

    // Other Europe (partial list of common names)
    'spanien': 'ES', 'spain': 'ES',
    'italien': 'IT', 'italy': 'IT',
    'vereinigtes königreich': 'GB', 'united kingdom': 'GB', 'uk': 'GB', 'großbritannien': 'GB', 'great britain': 'GB',
    'schweden': 'SE', 'sweden': 'SE',
    'norwegen': 'NO', 'norway': 'NO',
    'finnland': 'FI', 'finland': 'FI',
    'griechenland': 'GR', 'greece': 'GR',
    'irland': 'IE', 'ireland': 'IE',
    'portugal': 'PT',
    'russland': 'RU', 'russia': 'RU', // Sometimes needed
    'usa': 'US', 'united states': 'US', 'vereinigte staaten': 'US', // Common non-European
}

// Add all European names to map automatically for exact matches
Object.entries(EUROPEAN_COUNTRIES_MAP).forEach(([code, name]) => {
    NAME_TO_CODE_MAP[name.toLowerCase()] = code
})


/**
 * Returns a list of countries matching the input.
 * If no name is provided, returns a sorted list of all European countries.
 * If name is provided, performs a substring search (case-insensitive) on names and codes.
 * Returns unique matching countries.
 */
export function getIso3166_1_CountryCodeByCountry(countryName?: string): Country[] {
    if (!countryName) {
        return getSortedEuropeanCountries()
    }

    const search = countryName.trim().toLowerCase()
    const matchedCodes = new Set<string>()

    // Helper to add code if valid
    const addCode = (code: string) => {
        if (EUROPEAN_COUNTRIES_MAP[code as keyof typeof EUROPEAN_COUNTRIES_MAP]) {
            matchedCodes.add(code)
        }
    }

    // 1. Check exact/substring matches in NAME_TO_CODE_MAP keys (includes synonyms like "Germany")
    Object.entries(NAME_TO_CODE_MAP).forEach(([key, code]) => {
        if (key.includes(search)) {
            addCode(code)
        }
    })

    // 2. Check substring matches in official names (German)
    Object.entries(EUROPEAN_COUNTRIES_MAP).forEach(([code, name]) => {
        if (name.toLowerCase().includes(search) || code.toLowerCase().includes(search)) {
            matchedCodes.add(code)
        }
    })

    // Map to Country objects
    const results: Country[] = Array.from(matchedCodes).map(code => ({
        code,
        name: EUROPEAN_COUNTRIES_MAP[code as keyof typeof EUROPEAN_COUNTRIES_MAP]
    }))

    // Sort: Exact match first, then alphabetical
    results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === search || a.code.toLowerCase() === search
        const bExact = b.name.toLowerCase() === search || b.code.toLowerCase() === search
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.name.localeCompare(b.name, 'de')
    })

    return results
}

function getSortedEuropeanCountries(): Country[] {
    const all: Country[] = Object.entries(EUROPEAN_COUNTRIES_MAP).map(([code, name]) => ({ code, name }))

    return all.sort((a, b) => {
        // 1. Germany
        if (a.code === 'DE') return -1
        if (b.code === 'DE') return 1

        const isANeighbor = Object.prototype.hasOwnProperty.call(NEIGHBORS, a.code)
        const isBNeighbor = Object.prototype.hasOwnProperty.call(NEIGHBORS, b.code)

        // 2. Neighbors
        if (isANeighbor && !isBNeighbor) return -1
        if (!isANeighbor && isBNeighbor) return 1

        // If both are neighbors or both are not neighbors, sort alphabetically by name
        return a.name.localeCompare(b.name, 'de')
    })
}
