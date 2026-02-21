'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faUser, faDog, faTrash, faPaperPlane, faLock, faCommentAlt } from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
import { PhotoBoxCollectionSelector } from './photo-box-collection-selector'

export function PhotoBoxUploader() {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [persons, setPersons] = useState('')
    const [dogs, setDogs] = useState('')
    const [message, setMessage] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
            setStatus(null)
        }
    }

    const resetForm = () => {
        setSelectedImage(null)
        setPreviewUrl(null)
        setPersons('')
        setDogs('')
        setMessage('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCollectionId) {
            setStatus({ type: 'error', text: 'Bitte wähle zuerst eine Collection aus.' })
            return
        }
        if (!selectedImage) {
            setStatus({ type: 'error', text: 'Bitte wähle zuerst ein Foto aus.' })
            return
        }

        setIsUploading(true)
        setStatus(null)

        const formData = new FormData()
        formData.append('image', selectedImage)
        formData.append('persons', persons)
        formData.append('dogs', dogs)
        formData.append('message', message)
        formData.append('collectionId', selectedCollectionId)

        // Get token from auth state if available
        const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hzd_auth_state') || '{}').token : null
        if (token) {
            formData.append('token', token)
        }

        try {
            const response = await fetch('/api/photobox/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setStatus({ type: 'success', text: 'Foto erfolgreich an das TIK gesendet! Vielen Dank für deine Unterstützung.' })
                resetForm()
            } else {
                throw new Error(data.message || 'Fehler beim Hochladen.')
            }
        } catch (error) {
            console.error('PhotoBox upload error:', error)
            setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Verbindung zum Server fehlgeschlagen.' })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-12">
            {/* Section 1: Collection Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 ring-1 ring-gray-50">
                <PhotoBoxCollectionSelector
                    activeCollectionId={selectedCollectionId}
                    onCollectionChange={setSelectedCollectionId}
                />
            </div>

            {/* Section 2: Upload and Metadata */}
            <div className={`space-y-8 transition-all duration-500 ${!selectedCollectionId ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}>
                {status && (
                    <div className={`p-4 rounded-xl text-sm font-bold border animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        {status.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload Area */}
                    <div className="relative">
                        {!previewUrl ? (
                            <div
                                onClick={() => selectedCollectionId && fileInputRef.current?.click()}
                                className="group cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#4560AA] rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50/30 overflow-hidden relative"
                            >
                                <FontAwesomeIcon icon={faUpload} className="text-4xl text-gray-300 group-hover:text-[#4560AA] mb-4 transition-colors" />
                                <span className="text-gray-500 group-hover:text-[#4560AA] font-black transition-colors text-center">Foto aufnehmen oder auswählen</span>
                                <p className="text-[10px] text-gray-400 mt-2 font-black">Max. 50MB • JPG, PNG</p>

                                {!selectedCollectionId && (
                                    <div className="absolute inset-0 bg-gray-100/10 backdrop-blur-[1px] flex items-center justify-center">
                                        <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            <FontAwesomeIcon icon={faLock} className="text-[#4560AA] text-xs" />
                                            <span className="text-[10px] font-black text-[#4560AA]">Wähle zuerst eine Collection</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group ring-4 ring-white">
                                <Image
                                    unoptimized
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-white/20 hover:bg-red-500/80 p-6 rounded-full text-white backdrop-blur-md transition-all scale-90 group-hover:scale-100"
                                        title="Foto entfernen"
                                    >
                                        <FontAwesomeIcon icon={faTrash} size="2xl" />
                                    </button>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                    </div>

                    {/* Metadata Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-3 tracking-wide">
                                <FontAwesomeIcon icon={faUser} className="text-[#4560AA]" />
                                Personen auf dem Bild
                            </label>
                            <input
                                type="text"
                                value={persons}
                                onChange={(e) => setPersons(e.target.value)}
                                placeholder="z.B. Max Mustermann"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all font-bold placeholder:font-normal"
                                disabled={isUploading || !selectedCollectionId}
                            />
                        </div>

                        <div className="relative group">
                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-3 tracking-wide">
                                <FontAwesomeIcon icon={faDog} className="text-[#4560AA]" />
                                Welche Hunde sind zu sehen?
                            </label>
                            <input
                                type="text"
                                value={dogs}
                                onChange={(e) => setDogs(e.target.value)}
                                placeholder="z.B. Bello vom Hexenhaus"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all font-bold placeholder:font-normal"
                                disabled={isUploading || !selectedCollectionId}
                            />
                        </div>

                        <div className="relative group md:col-span-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-3 tracking-wide">
                                <FontAwesomeIcon icon={faCommentAlt} className="text-[#4560AA]" />
                                Deine Nachricht (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Möchtest du uns noch etwas zu diesem Foto mitteilen?"
                                rows={3}
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all font-bold placeholder:font-normal resize-none"
                                disabled={isUploading || !selectedCollectionId}
                            />
                        </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isUploading || !previewUrl || !selectedCollectionId}
                            className="w-full group bg-[#4560AA] hover:bg-[#344a8a] text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-blue-200/50 hover:shadow-blue-300/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-4"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="tracking-wide">Wird gesendet...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPaperPlane} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    <span className="tracking-wide">Jetzt an das TIK senden</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-8 font-black leading-relaxed">
                            Mit dem Absenden erklärst du dich damit einverstanden,<br />dass deine Fotos für die Berichterstattung genutzt werden dürfen.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
