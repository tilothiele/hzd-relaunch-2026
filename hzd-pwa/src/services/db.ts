import Dexie, { type EntityTable } from 'dexie';
import type { Wurfabnahme } from '@/types/wurfabnahme-form';

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
        Wurfabnahme,
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

db.version(3).stores({
    dogs: 'documentId, fullkennelname, microchipNo, cStudBookNumber',
    wurfabnahmen: 'id, updatedAt, zwingername, datum',
}).upgrade(async (tx) => {
    await tx.table('wurfabnahmen').toCollection().modify((item) => {
        if (Array.isArray(item.records)) {
            return
        }

        if (!item.formData) {
            item.records = []
            return
        }

        const now = new Date().toISOString()
        item.records = [{
            id: crypto.randomUUID(),
            createdAt: item.createdAt ?? now,
            updatedAt: item.updatedAt ?? now,
            zwingername: item.zwingername ?? '',
            datum: item.datum ?? '',
            welpenCount: item.welpenCount ?? 0,
            formData: item.formData,
        }]
        delete item.formData
    })
})

export type { Dog };
export { db };
