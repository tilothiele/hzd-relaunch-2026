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

const testCases = [
    { label: "Test", bg: generateHexColorFromLabel("Test") },
    { label: "News", bg: generateHexColorFromLabel("News") },
    { label: "Update", bg: generateHexColorFromLabel("Update") },
    { label: "HZD", bg: generateHexColorFromLabel("HZD") }
];

console.log("Testing Color Generation:");
testCases.forEach(tc => {
    const comp = getComplementaryColor(tc.bg);
    console.log(`Label: "${tc.label}" -> Bg: ${tc.bg}, Comp: ${comp}`);

    // Verify inversion
    const r = parseInt(tc.bg.substring(1, 3), 16);
    const g = parseInt(tc.bg.substring(3, 5), 16);
    const b = parseInt(tc.bg.substring(5, 7), 16);

    const rInv = parseInt(comp.substring(1, 3), 16);
    const gInv = parseInt(comp.substring(3, 5), 16);
    const bInv = parseInt(comp.substring(5, 7), 16);

    if (r + rInv !== 255 || g + gInv !== 255 || b + bInv !== 255) {
        console.error(`ERROR: Color ${tc.bg} and ${comp} are not complementary!`);
    } else {
        console.log("  -> OK (Complementary sum is 255)");
    }
});
