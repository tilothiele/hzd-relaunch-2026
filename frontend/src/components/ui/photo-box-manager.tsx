'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faImages } from '@fortawesome/free-solid-svg-icons'
import { PhotoBoxUploader } from './photo-box-uploader'
import { PhotoBoxList } from './photo-box-list'

type Tab = 'upload' | 'list'

interface PhotoBoxManagerProps {
    maxCollections?: number
    maxPhotosPerCollection?: number
    maxPhotoSizeMB?: number
    strapiBaseUrl?: string
}

export function PhotoBoxManager({
    maxCollections = 5,
    maxPhotosPerCollection = 10,
    maxPhotoSizeMB = 10,
    strapiBaseUrl
}: PhotoBoxManagerProps) {
    const [activeTab, setActiveTab] = useState<Tab>('upload')
    const [collectionsCount, setCollectionsCount] = useState(0)
    const [selectedCollectionPhotosCount, setSelectedCollectionPhotosCount] = useState(0)

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
            <header className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-[#4560AA] rounded-full mb-4">
                    <FontAwesomeIcon icon={activeTab === 'upload' ? faCamera : faImages} size="2xl" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">HZD PhotoBox</h2>
                <p className="text-gray-500 mt-2">Teile deine Momente direkt mit dem TIK</p>
            </header>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-gray-50 rounded-xl mb-8">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'upload'
                        ? 'bg-white text-[#4560AA] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FontAwesomeIcon icon={faCamera} />
                    Aufnahme
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'list'
                        ? 'bg-white text-[#4560AA] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FontAwesomeIcon icon={faImages} />
                    Meine Bilderspenden
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-500">
                {activeTab === 'upload' ? (
                    <PhotoBoxUploader
                        maxPhotosPerCollection={maxPhotosPerCollection}
                        maxPhotoSizeMB={maxPhotoSizeMB}
                        maxCollections={maxCollections}
                    />
                ) : (
                    <PhotoBoxList
                        maxCollections={maxCollections}
                        strapiBaseUrl={strapiBaseUrl}
                    />
                )}
            </div>
        </div>
    )
}
