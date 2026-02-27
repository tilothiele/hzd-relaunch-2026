import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImages, faCircleNotch, faUser, faDog, faCalendarAlt, faChevronRight, faArrowLeft, faFolderOpen, faTimes, faEdit, faSave, faBan, faCommentAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_MY_PHOTOBOX_COLLECTIONS } from '@/lib/graphql/queries'
import { UPDATE_PHOTOBOX_IMAGE, DELETE_PHOTOBOX_IMAGE, DELETE_PHOTOBOX_COLLECTION } from '@/lib/graphql/mutations'
import { useAuth } from '@/hooks/use-auth'
import type { PhotoboxImageCollection } from '@/types'
import Image from 'next/image'

interface PhotoBoxListProps {
    maxCollections?: number
}

export function PhotoBoxList({ maxCollections = 5 }: PhotoBoxListProps) {
    const { user } = useAuth()
    const [collections, setCollections] = useState<PhotoboxImageCollection[]>([])
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
    const [isLightboxLoading, setIsLightboxLoading] = useState(false)

    // Inline Editing States
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editPersons, setEditPersons] = useState('')
    const [editDogs, setEditDogs] = useState('')
    const [editMessage, setEditMessage] = useState('')
    const [isSaving, setIsSaving] = useState(false)

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

    const handleOpenLightbox = (path: string) => {
        setFullScreenImage(path)
        setIsLightboxLoading(true)
    }

    const startEditing = (img: any) => {
        setEditingId(img.documentId)
        setEditPersons(img.RenderedPersons || '')
        setEditDogs(img.ReneredDogs || '')
        setEditMessage(img.UserMessage || '')
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditPersons('')
        setEditDogs('')
        setEditMessage('')
    }

    const handleSave = async (imgId: string) => {
        setIsSaving(true)
        try {
            await fetchGraphQL(UPDATE_PHOTOBOX_IMAGE, {
                variables: {
                    documentId: imgId,
                    data: {
                        RenderedPersons: editPersons,
                        ReneredDogs: editDogs,
                        UserMessage: editMessage
                    }
                }
            })
            // Update local state
            setCollections(prev => prev.map(col => ({
                ...col,
                photos: col.photos?.map(p => p.documentId === imgId ? {
                    ...p,
                    RenderedPersons: editPersons,
                    ReneredDogs: editDogs,
                    UserMessage: editMessage
                } : p)
            })))
            setEditingId(null)
        } catch (error) {
            console.error('Error saving image metadata:', error)
            alert('Fehler beim Speichern der Änderungen.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteImage = async (imgId: string) => {
        if (!window.confirm('Möchtest du dieses Foto wirklich löschen?')) return
        try {
            await fetchGraphQL(DELETE_PHOTOBOX_IMAGE, {
                variables: { documentId: imgId }
            })
            // Update local state
            setCollections(prev => prev.map(col => ({
                ...col,
                photos: col.photos?.filter(p => p.documentId !== imgId)
            })))
        } catch (error) {
            console.error('Error deleting image:', error)
            alert('Fehler beim Löschen des Fotos.')
        }
    }

    const handleDeleteCollection = async (e: React.MouseEvent, colId: string) => {
        e.stopPropagation()
        if (!window.confirm('Möchtest du diese leere Collection wirklich löschen?')) return
        try {
            await fetchGraphQL(DELETE_PHOTOBOX_COLLECTION, {
                variables: { documentId: colId }
            })
            // Update local state
            setCollections(prev => prev.filter(c => c.documentId !== colId))
        } catch (error) {
            console.error('Error deleting collection:', error)
            alert('Fehler beim Löschen der Collection.')
        }
    }

    const selectedCollection = collections.find(c => c.documentId === selectedCollectionId)

    // --- Render Helpers ---

    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-3xl mb-4 text-[#4560AA]" />
                    <span className="text-xs font-black">Lade Bilderspenden...</span>
                </div>
            )
        }

        if (collections.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white shadow-sm ring-1 ring-gray-100 text-gray-300 rounded-full mb-6">
                        <FontAwesomeIcon icon={faImages} size="2xl" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Deine Bilderspenden</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-[10px] font-black leading-relaxed">
                        Du hast bisher noch keine Fotos hochgeladen oder deine Spenden werden noch verarbeitet.
                    </p>
                </div>
            )
        }

        if (selectedCollectionId && selectedCollection) {
            const photos = selectedCollection.photos || []
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedCollectionId(null)}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#4560AA] hover:border-[#4560AA] transition-all active:scale-90"
                                title="Zurück zur Übersicht"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedCollection.CollectionDescription}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-gray-400 font-bold">
                                        <span className="text-[#4560AA]">{photos.length}</span> {photos.length === 1 ? 'Aufnahme' : 'Aufnahmen'}
                                    </p>
                                    {selectedCollection.Location && (
                                        <>
                                            <span className="text-gray-200 border-l border-gray-200 h-3" />
                                            <p className="text-[10px] text-gray-400 font-bold italic">{selectedCollection.Location}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {photos.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Noch keine Fotos in dieser Collection.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {photos.map((img) => {
                                const isEditing = editingId === img.documentId
                                return (
                                    <div
                                        key={img.documentId}
                                        className={`group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 border border-gray-100 flex flex-col relative ${isEditing ? 'sm:col-span-2 lg:col-span-2 sm:flex-row' : ''
                                            }`}
                                    >

                                        {!isEditing && (
                                            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditing(img); }}
                                                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-[#4560AA] transition-all"
                                                    title="Bearbeiten"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} size="xs" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.documentId); }}
                                                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                                                    title="Löschen"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} size="xs" />
                                                </button>
                                            </div>
                                        )}

                                        <div
                                            className={`relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-zoom-in group/img ${isEditing ? 'sm:w-1/2 lg:w-2/5 sm:h-full' : ''
                                                }`}
                                            onClick={() => {
                                                if (img.S3Path) {
                                                    handleOpenLightbox(img.S3Path)
                                                }
                                            }}
                                        >
                                            {/* Skeleton Loader Overlay */}
                                            <div className="absolute inset-0 bg-gray-200 animate-pulse" />

                                            {img.S3Path ? (
                                                <Image
                                                    unoptimized
                                                    src={`/api/photobox/image?path=${encodeURIComponent(img.S3Path)}`}
                                                    alt="Hochgeladenes Foto"
                                                    fill
                                                    className="object-cover transition-transform duration-1000 group-hover/img:scale-110 relative z-0"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-200 z-10">
                                                    <FontAwesomeIcon icon={faImages} size="2xl" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-300" />
                                                    {img.createdAt ? new Date(img.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'k.A.'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`p-6 space-y-4 flex-grow flex flex-col ${isEditing ? 'sm:w-1/2 lg:w-3/5' : ''}`}>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4560AA] transition-colors duration-300">
                                                        <FontAwesomeIcon icon={faUser} className="text-[#4560AA] group-hover:text-white text-[8px] transition-colors" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <span className="block text-[8px] font-black text-gray-400 mb-0.5 uppercase tracking-wider">Personen</span>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editPersons}
                                                                onChange={(e) => setEditPersons(e.target.value)}
                                                                className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-black text-gray-900 focus:ring-1 focus:ring-[#4560AA]"
                                                                placeholder="Personen..."
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 font-black text-xs line-clamp-1">
                                                                {img.RenderedPersons ? img.RenderedPersons : <span className="text-red-500">Keine Angabe</span>}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4560AA] transition-colors duration-300">
                                                        <FontAwesomeIcon icon={faDog} className="text-[#4560AA] group-hover:text-white text-[8px] transition-colors" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <span className="block text-[8px] font-black text-gray-400 mb-0.5 uppercase tracking-wider">Hunde</span>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editDogs}
                                                                onChange={(e) => setEditDogs(e.target.value)}
                                                                className="w-full bg-gray-50 border-none rounded-lg p-2 text-xs font-black text-gray-900 focus:ring-1 focus:ring-[#4560AA]"
                                                                placeholder="Hunde..."
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 font-black text-xs line-clamp-1">
                                                                {img.ReneredDogs ? img.ReneredDogs : <span className="text-red-500">Keine Angabe</span>}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {(img.UserMessage || isEditing) && (
                                                <div className="pt-4 border-t border-gray-50 group-hover:border-gray-100 transition-colors">
                                                    <span className="block text-[8px] font-black text-gray-400 mb-1 uppercase tracking-wider">Nachricht</span>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={editMessage}
                                                            onChange={(e) => setEditMessage(e.target.value)}
                                                            className="w-full bg-gray-50 border-none rounded-lg p-2 text-[10px] font-medium text-gray-600 focus:ring-1 focus:ring-[#4560AA] resize-none"
                                                            rows={2}
                                                            placeholder="Nachricht..."
                                                        />
                                                    ) : (
                                                        <p className="text-[10px] text-gray-500 italic font-medium leading-relaxed line-clamp-2">
                                                            "{img.UserMessage}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {isEditing && (
                                                <div className="pt-4 flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(img.documentId)}
                                                        disabled={isSaving}
                                                        className="flex-grow bg-[#4560AA] text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 hover:bg-[#344a8a] transition-all"
                                                    >
                                                        {isSaving ? (
                                                            <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faSave} />
                                                        )}
                                                        Speichern
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="w-10 h-10 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 flex items-center justify-center transition-all bg-gray-50/50"
                                                        title="Abbrechen"
                                                    >
                                                        <FontAwesomeIcon icon={faBan} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )
        }

        // List View: Show Collections
        return (
            <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Deine Bilderspenden</h2>
                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
                            Wähle eine Collection, um die Fotos anzusehen
                        </p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-[#4560AA] uppercase tracking-widest text-center">
                            Collections: <span className="text-gray-900">{collections.length}</span> / {maxCollections}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((col) => {
                        const photoCount = col.photos?.length || 0
                        const lastPhoto = col.photos?.[0]

                        return (
                            <button
                                key={col.documentId}
                                onClick={() => setSelectedCollectionId(col.documentId)}
                                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-gray-100 text-left flex flex-col h-full"
                            >
                                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                                    {/* Skeleton Loader Overlay */}
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />

                                    {lastPhoto?.S3Path ? (
                                        <Image
                                            unoptimized
                                            src={`/api/photobox/image?path=${encodeURIComponent(lastPhoto.S3Path)}`}
                                            alt={col.CollectionDescription || 'Collection'}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105 relative z-0"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200 z-10">
                                            <FontAwesomeIcon icon={faFolderOpen} size="3x" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                                        {photoCount === 0 && (
                                            <button
                                                onClick={(e) => handleDeleteCollection(e, col.documentId)}
                                                className="bg-white/95 backdrop-blur shadow-sm w-7 h-7 rounded-full text-gray-400 hover:text-red-500 transition-all flex items-center justify-center"
                                                title="Leere Collection löschen"
                                            >
                                                <FontAwesomeIcon icon={faTrash} size="xs" />
                                            </button>
                                        )}
                                        <span className="bg-white/95 backdrop-blur shadow-sm px-3 py-1.5 rounded-full text-[10px] font-black text-[#4560AA] uppercase tracking-widest">
                                            {photoCount} {photoCount === 1 ? 'Foto' : 'Fotos'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-black text-gray-900 group-hover:text-[#4560AA] transition-colors leading-tight">
                                            {col.CollectionDescription || 'Einzelspende'}
                                        </h3>
                                        {col.Location && (
                                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider italic">
                                                {col.Location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[#4560AA] font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Ansehen <FontAwesomeIcon icon={faChevronRight} />
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            {renderMainContent()}

            {/* Lightbox Overlay */}
            {fullScreenImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-90 z-[10000]"
                        onClick={(e) => {
                            e.stopPropagation()
                            setFullScreenImage(null)
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} size="xl" />
                    </button>

                    {/* Loading Spinner for Lightbox */}
                    {isLightboxLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-4">
                            <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Lade Foto...</span>
                        </div>
                    )}

                    <div className="relative w-full h-full max-w-5xl max-h-[90vh] p-4 flex items-center justify-center pointer-events-none">
                        <Image
                            unoptimized
                            src={`/api/photobox/image?path=${encodeURIComponent(fullScreenImage)}`}
                            alt="Full screen photo"
                            className={`object-contain w-full h-full animate-in zoom-in-95 duration-500 pointer-events-auto transition-opacity duration-300 ${isLightboxLoading ? 'opacity-0' : 'opacity-100'}`}
                            width={1920}
                            height={1080}
                            onClick={(e) => e.stopPropagation()}
                            onLoad={() => setIsLightboxLoading(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
