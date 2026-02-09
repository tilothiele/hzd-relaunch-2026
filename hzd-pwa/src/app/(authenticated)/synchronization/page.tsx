import SyncButton from '@/components/SyncButton';

export default function SynchronizationPage() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Synchronization</h1>
            <p>Hier können Sie Daten synchronisieren.</p>
            <SyncButton />
        </div>
    );
}
