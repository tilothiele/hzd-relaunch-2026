import { db } from './db';

interface SyncResult {
    success: boolean;
    message: string;
    count?: number;
}

export async function syncDogs(onProgress?: (current: number, total: number) => void): Promise<SyncResult> {
    try {
        let allDogs: any[] = [];
        let page = 1;
        const pageSize = 100;
        let pageCount = 1;
        let total = 0;

        // Keep track of IDs seen to detect infinite loops of same data
        const seenIds = new Set<string>();

        do {
            // Manually construct query string to avoid encoding brackets if that's the issue
            const queryString = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
            const url = `/api/proxy/hzd-plugin/dogs?${queryString}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, message: `Page ${page} failed: ${response.status} ${response.statusText} - ${errorText}` };
            }

            const json = await response.json();

            let data = json.data;
            if (json.results) {
                data = json.results;
            } else if (Array.isArray(json)) {
                data = json;
            }

            if (!Array.isArray(data)) {
                if (page === 1) {
                    const preview = JSON.stringify(json).substring(0, 100);
                    return { success: false, message: `Invalid data format. Keys: ${Object.keys(json).join(', ')}. Preview: ${preview}` };
                }
                console.warn(`Page ${page} returned invalid format. Stopping sync.`);
                break;
            }

            // Check for duplicates / infinite loop of same data
            const newIds = data.map((d: any) => d.documentId || d.id);
            const hasNewData = newIds.some((id: string) => !seenIds.has(id));

            if (!hasNewData && newIds.length > 0 && page > 1) {
                console.warn(`Page ${page} returned only data we have already seen. The API might be ignoring pagination parameters. Stopping to avoid duplicates.`);
                break;
            }

            newIds.forEach((id: string) => seenIds.add(id));
            allDogs = allDogs.concat(data);

            // Determine pagination
            if (json.pagination) {
                pageCount = json.pagination.pageCount || 1;
                total = json.pagination.total || 0;
            } else if (json.meta && json.meta.pagination) {
                pageCount = json.meta.pagination.pageCount || 1;
                total = json.meta.pagination.total || 0;
            } else {
                if (data.length < pageSize) {
                    pageCount = page;
                } else {
                    // If we don't know, assume there's one more page
                    pageCount = page + 1;
                }
            }

            if (onProgress) {
                // Estimate total if not provided
                const estimatedTotal = total || (allDogs.length + (data.length === pageSize ? pageSize : 0));
                onProgress(allDogs.length, estimatedTotal);
            }

            // Allow UI update
            await new Promise(resolve => setTimeout(resolve, 0));

            page++;
        } while (page <= pageCount);

        // 2. Transform data
        const dogs = allDogs.map((item: any) => ({
            documentId: item.documentId,
            fullkennelname: item.fullKennelName || item.FullKennelName || item.fullkennelname || '',
            dateofbirth: item.dateOfBirth || item.DateOfBirth || item.dateofbirth || '',
            dateofdeath: item.dateOfDeath || item.DateOfDeath || item.dateofdeath || null,
            microchipNo: item.microchipNo || item.MicrochipNo || '',
            sex: item.sex || item.Sex || '',
            color: item.color || item.Color || '',
            ownerName: item.owner?.name || item.owner?.Name || item.owner?.username || '',
            cStudBookNumber: item.cStudBookNumber || item.CStudBookNumber || '',
            cFertile: item.cFertile === true ? 'Ja' : (item.cFertile === false ? 'Nein' : (item.cFertile || item.CFertile || '')),
        }));

        // 3. Clear and Bulk Put to Dexie
        const uniqueDogs = Array.from(new Map(dogs.map(item => [item.documentId, item])).values());

        await db.transaction('rw', db.dogs, async () => {
            await db.dogs.clear();
            await db.dogs.bulkPut(uniqueDogs);
        });

        return { success: true, message: `Sync successful. ${uniqueDogs.length} dogs loaded.`, count: uniqueDogs.length };

    } catch (error) {
        console.error('Sync error:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error during sync' };
    }
}
