import type { Dog, HzdSetting } from '@/types'

/**
 * Resolves the display image for a dog.
 * Priority:
 * 1. dog.avatar
 * 2. dog.color specific default from HzdSetting
 * 3. Hardcoded color fallback
 */
export function resolveDogImage(dog: Dog, hzdSetting: HzdSetting | null | undefined, strapiBaseUrl: string | null | undefined): string {
    const baseUrl = strapiBaseUrl ?? ''

    // 1. Check for specific avatar
    if (dog.avatar?.url) {
        return `${baseUrl}${dog.avatar.url}`
    }

    // 2. Check for HZD Setting defaults based on color
    if (dog.color === 'S' && hzdSetting?.DefaultAvatarS?.url) {
        return `${baseUrl}${hzdSetting.DefaultAvatarS.url}`
    }
    if (dog.color === 'SM' && hzdSetting?.DefaultAvatarSM?.url) {
        return `${baseUrl}${hzdSetting.DefaultAvatarSM.url}`
    }
    if (dog.color === 'B' && hzdSetting?.DefaultAvatarB?.url) {
        return `${baseUrl}${hzdSetting.DefaultAvatarB.url}`
    }

    // 3. Hardcoded fallbacks
    switch (dog.color) {
        case 'S':
            return '/static-images/hovis/hovi-schwarz.jpg'
        case 'SM':
            return '/static-images/hovis/hovi-schwarzmarken.jpg'
        case 'B':
            return '/static-images/hovis/hovi-blond.jpg'
        default:
            return '/static-images/hovis/hovi-schwarz.jpg'
    }
}
