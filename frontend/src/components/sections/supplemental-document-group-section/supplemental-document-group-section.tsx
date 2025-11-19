'use client'

import { useMemo } from 'react'
import type { SupplementalDocumentGroupSection, SupplementalDocument } from '@/types'

interface SupplementalDocumentGroupSectionComponentProps {
	section: SupplementalDocumentGroupSection
	strapiBaseUrl: string
}

function isDocumentVisible(document: SupplementalDocument | null | undefined): boolean {
	if (!document) {
		return false
	}

	const now = new Date()
	const visibilityStart = document.VisibilityStart ? new Date(document.VisibilityStart) : null
	const visibilityEnd = document.VisibilityEnd ? new Date(document.VisibilityEnd) : null

	if (visibilityStart && now < visibilityStart) {
		return false
	}

	if (visibilityEnd && now > visibilityEnd) {
		return false
	}

	return true
}

function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes) {
		return ''
	}

	if (bytes < 1024) {
		return `${bytes} B`
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`
	}

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SupplementalDocumentGroupSectionComponent({
	section,
	strapiBaseUrl,
}: SupplementalDocumentGroupSectionComponentProps) {
	const documentGroup = section.supplemental_document_group

	const visibleDocuments = useMemo(() => {
		if (!documentGroup?.supplemental_documents) {
			return []
		}

		return documentGroup.supplemental_documents
			.filter(isDocumentVisible)
			.sort((a, b) => {
				// Sortiere nach Name, falls SortOrd nicht vorhanden
				if (!a.Name || !b.Name) {
					return 0
				}
				return a.Name.localeCompare(b.Name, 'de')
			})
	}, [documentGroup])

	if (!documentGroup || visibleDocuments.length === 0) {
		return null
	}

	const groupName = documentGroup.Name || section.Headline || 'Dokumente'

	return (
		<section className='mb-16 px-4'>
			<div className='mx-auto w-full max-w-4xl'>
				{section.Headline ? (
					<h2 className='mb-6 text-3xl font-bold text-gray-900'>{section.Headline}</h2>
				) : null}
				{groupName && !section.Headline ? (
					<h2 className='mb-6 text-3xl font-bold text-gray-900'>{groupName}</h2>
				) : null}

				<div className='space-y-4'>
					{visibleDocuments.map((document) => {
						const documents = document.DownloadDocument || []
						const documentId = document.documentId || document.Name || 'unknown'

						return (
							<article
								key={documentId}
								className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'
							>
								<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
									<div className='flex-1'>
										{document.Name ? (
											<h3 className='text-xl font-semibold text-gray-900'>{document.Name}</h3>
										) : null}
										{document.Description ? (
											<div
												className='mt-2 text-sm text-gray-600 prose prose-sm max-w-none'
												dangerouslySetInnerHTML={{ __html: document.Description }}
											/>
										) : null}
										{document.ShortId ? (
											<p className='mt-2 text-xs text-gray-500'>ID: {document.ShortId}</p>
										) : null}
									</div>

									<div className='flex flex-col gap-2 md:items-end'>
										{documents.map((file, fileIndex) => {
											const fileUrl = file.url.startsWith('http')
												? file.url
												: `${strapiBaseUrl}${file.url}`

											return (
												<a
													key={fileIndex}
													href={fileUrl}
													download
													className='inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-yellow-500'
												>
													<svg
														className='h-5 w-5'
														fill='none'
														stroke='currentColor'
														viewBox='0 0 24 24'
													>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
														/>
													</svg>
													<span>Download</span>
													{file.name ? (
														<span className='text-xs opacity-75'>({file.name})</span>
													) : null}
													{file.size ? (
														<span className='text-xs opacity-75'>
															{formatFileSize(file.size)}
														</span>
													) : null}
												</a>
											)
										})}
									</div>
								</div>
							</article>
						)
					})}
				</div>
			</div>
		</section>
	)
}

