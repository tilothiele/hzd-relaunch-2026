'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faUpload, faUser, faDog, faTrash, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'

export function PhotoBoxManager() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [persons, setPersons] = useState('')
    const [dogs, setDogs] = useState('')
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
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
        <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
            <header className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-[#4560AA] rounded-full mb-4">
                    <FontAwesomeIcon icon={faCamera} size="2xl" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">HZD PhotoBox</h2>
                <p className="text-gray-500 mt-2">Teile deine Momente direkt mit dem TIK</p>
            </header>

            {status && (
                <div className={`mb-8 p-4 rounded-xl text-sm font-bold border animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {status.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Upload Area */}
                <div className="relative">
                    {!previewUrl ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#4560AA] rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50/30"
                        >
                            <FontAwesomeIcon icon={faUpload} className="text-4xl text-gray-300 group-hover:text-[#4560AA] mb-4 transition-colors" />
                            <span className="text-gray-500 group-hover:text-[#4560AA] font-bold transition-colors">Foto aufnehmen oder auswählen</span>
                            <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-black">Max. 50MB • JPG, PNG</p>
                        </div>
                    ) : (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-white/20 hover:bg-red-500/80 p-4 rounded-full text-white backdrop-blur-md transition-all scale-90 group-hover:scale-100"
                                    title="Foto entfernen"
                                >
                                    <FontAwesomeIcon icon={faTrash} size="xl" />
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
                <div className="space-y-6">
                    <div className="relative group">
                        <label className="flex items-center gap-2 text-sm font-black text-gray-600 mb-3 uppercase tracking-wider">
                            <FontAwesomeIcon icon={faUser} className="text-[#4560AA] text-xs" />
                            Personen auf dem Bild
                        </label>
                        <input
                            type="text"
                            value={persons}
                            onChange={(e) => setPersons(e.target.value)}
                            placeholder="z.B. Max Mustermann, Erika Musterfrau"
                            className="w-full bg-gray-50 border-none rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all"
                            disabled={isUploading}
                        />
                    </div>

                    <div className="relative group">
                        <label className="flex items-center gap-2 text-sm font-black text-gray-600 mb-3 uppercase tracking-wider">
                            <FontAwesomeIcon icon={faDog} className="text-[#4560AA] text-xs" />
                            Welche Hunde sind zu sehen?
                        </label>
                        <input
                            type="text"
                            value={dogs}
                            onChange={(e) => setDogs(e.target.value)}
                            placeholder="z.B. Bello vom Hexenhaus, Luna"
                            className="w-full bg-gray-50 border-none rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-[#4560AA] transition-all"
                            disabled={isUploading}
                        />
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isUploading || !previewUrl}
                        className="w-full group bg-[#4560AA] hover:bg-[#344a8a] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200/50 hover:shadow-blue-300/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                Wird gesendet...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faPaperPlane} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Jetzt an das TIK senden
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest leading-relaxed">
                        Mit dem Absenden erklärst du dich damit einverstanden,<br />dass deine Fotos für die Berichterstattung genutzt werden dürfen.
                    </p>
                </div>
            </form>
        </div>
    )
}
