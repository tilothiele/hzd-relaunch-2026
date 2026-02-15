export default {
    async beforeCreate(event) {
        const { data } = event.params;

        // 1. TagBgColorHexCode
        if (!data.TagBgColorHexCode && data.Label) {
            data.TagBgColorHexCode = generateHexColorFromLabel(data.Label);
        }

        // 2. TagColorHexCode (Complementary)
        // If TagColorHexCode is missing, derive it from TagBgColorHexCode (which might have just been generated)
        if (!data.TagColorHexCode && data.TagBgColorHexCode) {
            data.TagColorHexCode = getComplementaryColor(data.TagBgColorHexCode);
        }
    },

    async beforeUpdate(event) {
        const { data, where } = event.params;

        // We need to determine the final TagBgColorHexCode to calculate the complementary TagColorHexCode if needed.
        let finalBgColor = data.TagBgColorHexCode;

        // Scenario A: TagBgColorHexCode is being updated explicitly.
        // If it is valid, we use it. 
        // If it's being cleared (null/empty), we might need to regenerate it from Label.

        // Scenario B: TagBgColorHexCode is NOT in data (not being updated).
        // We might need to fetch the existing one if we are updating TagColorHexCode, 
        // OR if Label changes and we want to regenerate BgColor.

        // Let's simplify:
        // 1. Resolve TagBgColorHexCode
        //    - If provided and valid -> use it.
        //    - If provided and empty/null -> regenerate from Label (New or Existing).
        //    - If not provided -> 
        //         If Label changes -> regenerate from New Label? (Decision: YES, if Label changes, we usually want to re-hash the color unless BgColor is explicitly frozen. But here we assume auto-gen is desired).
        //         If Label doesn't change -> keep existing BgColor.

        const isBgColorExplicitlyCleared = (data.TagBgColorHexCode === null || data.TagBgColorHexCode === "");
        const isLabelChanging = (data.Label && data.Label.trim() !== "");

        // If we need to regenerate BgColor or if we need the existing Label to regenerate:
        if (isBgColorExplicitlyCleared || (isLabelChanging && !data.TagBgColorHexCode)) {
            // We need the Label. If it's in data, use it. If not, fetch it.
            let labelToUse = data.Label;

            if (!labelToUse) {
                const entity = await strapi.entityService.findOne('api::news-article-tag.news-article-tag', where.id);
                if (entity) labelToUse = entity.Label;
            }

            if (labelToUse) {
                finalBgColor = generateHexColorFromLabel(labelToUse);
                data.TagBgColorHexCode = finalBgColor;
            }
        }

        // If TagBgColorHexCode was not in data and not regenerated, it means it's unchanged.
        // But if we need to calculate TagColorHexCode, we might need the existing BgColor.

        // 2. Resolve TagColorHexCode
        //    - If provided and valid -> use it.
        //    - If provided and empty/null -> regenerate from (New or Existing) BgColor.
        //    - If not provided ->
        //         If BgColor changed (in data) -> regenerate from New BgColor.
        //         If BgColor didn't change -> do nothing.

        const isTextColorExplicitlyCleared = (data.TagColorHexCode === null || data.TagColorHexCode === "");
        const isBgColorChanged = (data.TagBgColorHexCode !== undefined); // It is present in payload (either explicitly set or set by us above)

        if (isTextColorExplicitlyCleared || (isBgColorChanged && !data.TagColorHexCode)) {
            // We need a BgColor to generate the text color
            if (!finalBgColor) {
                // Fetch existing if not already available
                if (data.TagBgColorHexCode) {
                    finalBgColor = data.TagBgColorHexCode;
                } else {
                    const entity = await strapi.entityService.findOne('api::news-article-tag.news-article-tag', where.id);
                    if (entity) finalBgColor = entity.TagBgColorHexCode;
                }
            }

            if (finalBgColor) {
                data.TagColorHexCode = getComplementaryColor(finalBgColor);
            }
        }
    },
};

function generateHexColorFromLabel(label: string): string {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
}

function getComplementaryColor(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    if (hex.length !== 6) {
        return '#000000'; // Fallback
    }

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Invert to get complementary color
    const rInv = 255 - r;
    const gInv = 255 - g;
    const bInv = 255 - b;

    return `#${rInv.toString(16).padStart(2, '0')}${gInv.toString(16).padStart(2, '0')}${bInv.toString(16).padStart(2, '0')}`;
}
