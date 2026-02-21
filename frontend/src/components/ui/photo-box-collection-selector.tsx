'use client'

import { useState, useEffect } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_MY_PHOTOBOX_COLLECTIONS } from '@/lib/graphql/queries'
import { CREATE_PHOTOBOX_COLLECTION } from '@/lib/graphql/mutations'
import { useAuth } from '@/hooks/use-auth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFolderOpen, faLocationDot, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import type { PhotoboxImageCollection } from '@/types'

interface PhotoBoxCollectionSelectorProps {
    onCollectionChange: (collectionId: string | null) => void
    activeCollectionId: string | null
}

export function PhotoBoxCollectionSelector({ onCollectionChange, activeCollectionId }: PhotoBoxCollectionSelectorProps) {
    const { user } = useAuth()
    const [collections, setCollections] = useState<PhotoboxImageCollection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [showModal, setShowModal] = useState(false)

    // Modal state
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')

    const loadCollections = async () => {
        if (!user?.documentId) return
        setIsLoading(true)
        try {
            const data = await fetchGraphQL<{ photoboxImageCollections: PhotoboxImageCollection[] }>(
                GET_MY_PHOTOBOX_COLLECTIONS,
                { variables: { userId: user.documentId } }
            )
            setCollections(data.photoboxImageCollections)
        } catch (error) {
            console.error('Error loading collections:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user?.documentId) {
            loadCollections()
        }
    }, [user?.documentId])

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.documentId || !description) return

        setIsCreating(true)
        try {
            const result = await fetchGraphQL<{ createPhotoboxImageCollection: PhotoboxImageCollection }>(
                CREATE_PHOTOBOX_COLLECTION,
                {
                    variables: {
                        data: {
                            CollectionDescription: description,
                            Location: location,
                            photogapher: user.documentId,
                            publishedAt: new Date().toISOString()
                        }
                    }
                }
            )

            if (result.createPhotoboxImageCollection) {
                const newCollection = result.createPhotoboxImageCollection
                setCollections(prev => [newCollection, ...prev])
                onCollectionChange(newCollection.documentId)
                setShowModal(false)
                setDescription('')
                setLocation('')
            }
        } catch (error) {
            console.error('Error creating collection:', error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#4560AA]">
                        <FontAwesomeIcon icon={faFolderOpen} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 tracking-tight">Vorgang / Collection</h3>
                        <p className="text-[10px] text-gray-400 font-bold">Wähle aus, wohin das Foto sortiert werden soll</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#4560AA] hover:text-[#4560AA] rounded-xl text-sm font-black transition-all shadow-sm active:scale-95"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    Neue Collection
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                    <div className="col-span-full py-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-2xl mb-2" />
                        <span className="text-xs font-black">Lade Collections...</span>
                    </div>
                ) : collections.length === 0 ? (
                    <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-bold text-gray-500">Noch keine Collections vorhanden.</p>
                        <p className="text-[10px] mt-1 font-black">Erstelle deine erste Collection!</p>
                    </div>
                ) : (
                    collections.map((col) => (
                        <button
                            key={col.documentId}
                            type="button"
                            onClick={() => onCollectionChange(col.documentId)}
                            className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${activeCollectionId === col.documentId
                                ? 'border-[#4560AA] bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                                : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-gray-100/50'
                                }`}
                        >
                            <div className="relative z-10">
                                <div className="font-black text-gray-900 line-clamp-1">{col.CollectionDescription || 'Ohne Titel'}</div>
                                {col.Location && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 font-bold">
                                        <FontAwesomeIcon icon={faLocationDot} className="text-xs text-[#4560AA]" />
                                        {col.Location}
                                    </div>
                                )}
                            </div>
                            {activeCollectionId === col.documentId && (
                                <div className="absolute top-1 right-1">
                                    <div className="w-2 h-2 rounded-full bg-[#4560AA] animate-pulse" />
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleCreateCollection}>
                            <div className="p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Neue Collection</h2>
                                    <p className="text-gray-400 text-sm font-bold mt-1">Ereignis oder Themenpaket anlegen</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 block ml-1">Bezeichnung / Titel</label>
                                        <input
                                            autoFocus
                                            required
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="z.B. Wurfabnahme A-Wurf vom Hexenhaus"
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 block ml-1">Ort (optional)</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="z.B. Musterstadt"
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isCreating || !description}
                                        className="w-full py-4 bg-[#4560AA] hover:bg-[#344a8a] text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isCreating ? (
                                            <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-xl" />
                                        ) : 'Erstellen und auswählen'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="w-full py-4 text-gray-400 hover:text-gray-600 font-bold transition-all text-xs"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
