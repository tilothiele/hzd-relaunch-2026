import Dexie, { type EntityTable } from 'dexie';
import type { WurfabnahmeRecord } from '@/types/wurfabnahme-form';

interface Dog {
    documentId: string;
    fullkennelname: string;
    dateofbirth: string;
    dateofdeath: string | null;
    microchipNo: string;
    sex: string;
    color: string;
    ownerName: string; // Flattened from owner.name
    cStudBookNumber: string;
    cFertile: string;
}

const db = new Dexie('HzdDatabase') as Dexie & {
    dogs: EntityTable<
        Dog,
        'documentId' // primary key "documentId" (for the typings only)
    >;
    wurfabnahmen: EntityTable<
        WurfabnahmeRecord,
        'id'
    >;
};

// Schema declaration:
db.version(1).stores({
    dogs: 'documentId, fullkennelname, microchipNo, cStudBookNumber' // Primary key and indexed props
});

db.version(2).stores({
    dogs: 'documentId, fullkennelname, microchipNo, cStudBookNumber',
    wurfabnahmen: 'id, updatedAt, zwingername, datum',
});

export type { Dog };
export { db };
