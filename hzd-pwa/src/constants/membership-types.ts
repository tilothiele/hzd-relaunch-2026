// Konstanten für Mitgliedschaftstypen
// Diese Datei richtet sich nach dem aktuellen Frontend und kann auch im Backend verwendet werden

export interface MembershipType {
  id: string;
  label: string;
  price: string;
  period: string;
  description?: string;
  requiresDateRange?: boolean;
}

export const MEMBERSHIP_TYPE_HZD_VOLLMITGLIED =   {
    id: 'HZD Vollmitgliedschaft',
    label: 'HZD Vollmitgliedschaft',
    price: '35 €',
    period: 'jährlich',
    description: 'Ortsgruppenmitglied mit HZD Vollmitgliedschaft',
  };
export const MEMBERSHIP_TYPE_HZD_FAMILIENMITGLIED = {
    id: 'HZD Familienmitglied',
    label: 'HZD Familienmitglied',
    price: '16 €',
    period: 'jährlich',
    description: 'Familienmitgliedschaft mit HZD-Mitgliedschaft',
  };
export const MEMBERSHIP_TYPE_OG_MITGLIED = {
    id: 'Ortsgruppenmitglied',
    label: 'Ortsgruppenmitglied',
    price: '138 €',
    period: 'jährlich',
    description: 'Nur Ortsgruppenmitgliedschaft ohne HZD-Vollmitgliedschaft',
  };
export const MEMBERSHIP_TYPE_OG_FAMILIENMITGLIED = {
    id: 'OG Familienmitglied',
    label: 'OG Familienmitglied',
    price: '16 €',
    period: 'jährlich',
    description: 'Familienmitgliedschaft ohne HZD-Mitgliedschaft',
  };
export const MEMBERSHIP_TYPE_KURZZEITMITGLIED = {
    id: 'Kurzzeitmitglied',
    label: 'Kurzzeitmitglied',
    price: '11,50 €',
    period: 'pro Monat',
    description: 'Kurzzeitmitgliedschaft für mindestens 3 Monate',
    requiresDateRange: true,
  };

// Verfügbare Mitgliedschaftstypen basierend auf dem aktuellen Frontend
export const MEMBERSHIP_TYPES: MembershipType[] = [
  MEMBERSHIP_TYPE_HZD_VOLLMITGLIED,
  MEMBERSHIP_TYPE_HZD_FAMILIENMITGLIED,
  MEMBERSHIP_TYPE_OG_MITGLIED,
  MEMBERSHIP_TYPE_OG_FAMILIENMITGLIED,
  MEMBERSHIP_TYPE_KURZZEITMITGLIED
];

// Hilfsfunktionen
export const getMembershipTypeById = (id: string): MembershipType | undefined => {
  return MEMBERSHIP_TYPES.find(type => type.id === id);
};

export const getMembershipTypesRequiringDateRange = (): MembershipType[] => {
  return MEMBERSHIP_TYPES.filter(type => type.requiresDateRange);
};

// Validierung
export const isValidMembershipType = (id: string): boolean => {
  return MEMBERSHIP_TYPES.some(type => type.id === id);
};

// Labels für UI
export const MEMBERSHIP_LABELS = MEMBERSHIP_TYPES.reduce((acc, type) => {
  acc[type.id] = type.label;
  return acc;
}, {} as Record<string, string>);

// Preise für UI
export const MEMBERSHIP_PRICES = MEMBERSHIP_TYPES.reduce((acc, type) => {
  acc[type.id] = type.price;
  return acc;
}, {} as Record<string, string>);

// Zeiträume für UI
export const MEMBERSHIP_PERIODS = MEMBERSHIP_TYPES.reduce((acc, type) => {
  acc[type.id] = type.period;
  return acc;
}, {} as Record<string, string>);

// Familienmitgliedschaft Hinweis
export const FAMILY_MEMBERSHIP_NOTE = 'Familienmitglied kann werden, wer in häuslicher Gemeinschaft mit einem OG-Vollmitglied lebt.';

// Kurzzeitmitgliedschaft Mindestdauer (in Monaten)
export const MIN_SHORT_TERM_DURATION_MONTHS = 3;

// Alle verfügbaren IDs als Array für einfache Validierung
export const MEMBERSHIP_IDS = MEMBERSHIP_TYPES.map(type => type.id);

// Typ für TypeScript
export type MembershipId = typeof MEMBERSHIP_IDS[number];