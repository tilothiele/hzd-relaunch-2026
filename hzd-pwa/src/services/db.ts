import Dexie, { type EntityTable } from 'dexie';

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
};

// Schema declaration:
db.version(1).stores({
    dogs: 'documentId, fullkennelname, microchipNo, cStudBookNumber' // Primary key and indexed props
});

export type { Dog };
export { db };
