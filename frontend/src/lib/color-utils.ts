export interface TagColorProps {
    TagColorHexCode?: string | null
    TagBgColorHexCode?: string | null
}

/**
 * Calculates the complementary color for a given hex color.
 * Returns the hex code with a leading #.
 */
export function getComplementaryColor(hex: string): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '')

    // Parse hex
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)

    // Calculate complementary
    const compR = (255 - r).toString(16).padStart(2, '0')
    const compG = (255 - g).toString(16).padStart(2, '0')
    const compB = (255 - b).toString(16).padStart(2, '0')

    return `#${compR}${compG}${compB}`.toUpperCase()
}

/**
 * Resolves the text and background colors for a tag based on available data.
 * Logic:
 * 1. If both defined: use them.
 * 2. If one defined: calculate other as complementary.
 * 3. If neither: default to Black Bg / White Text. (Note: User request said Bg=Black, Text=White)
 *    wait, user request said: "wenn beide nicht definiert sind, soll hintergrund=black, text=white genommen werden."
 *    Implementation below follows this.
 */
export function resolveTagColors(tag: TagColorProps): { color: string; backgroundColor: string } {
    const { TagColorHexCode, TagBgColorHexCode } = tag

    const hasText = !!TagColorHexCode
    const hasBg = !!TagBgColorHexCode

    // Case 1: Both defined
    if (hasText && hasBg) {
        return {
            color: TagColorHexCode!.startsWith('#') ? TagColorHexCode! : `#${TagColorHexCode}`,
            backgroundColor: TagBgColorHexCode!.startsWith('#') ? TagBgColorHexCode! : `#${TagBgColorHexCode}`
        }
    }

    // Case 2: Only Text defined -> Calculate Bg
    if (hasText && !hasBg) {
        const textColor = TagColorHexCode!.startsWith('#') ? TagColorHexCode! : `#${TagColorHexCode}`
        return {
            color: textColor,
            backgroundColor: getComplementaryColor(textColor)
        }
    }

    // Case 3: Only Bg defined -> Calculate Text
    if (!hasText && hasBg) {
        const bgColor = TagBgColorHexCode!.startsWith('#') ? TagBgColorHexCode! : `#${TagBgColorHexCode}`
        return {
            color: getComplementaryColor(bgColor),
            backgroundColor: bgColor
        }
    }

    // Case 4: Neither defined -> Default
    return {
        color: '#FFFFFF',
        backgroundColor: '#000000'
    }
}
