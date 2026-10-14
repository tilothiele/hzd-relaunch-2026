'use client'

import Link from 'next/link'
import type { GlobalLayout } from '@/types'
import Image from 'next/image'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '../header/logo-utils'
import { SocialLinks } from '../header/social-links'

interface FooterProps {
	globalLayout?: GlobalLayout | null
	strapiBaseUrl?: string | null
	theme: ThemeDefinition
}

export function Footer({ globalLayout, strapiBaseUrl, theme }: FooterProps) {
	const currentYear = new Date().getFullYear()

	const logoImage = globalLayout?.Logo

	const logoSrc = resolveMediaUrl(logoImage, strapiBaseUrl) ?? ''
	const logoAlt = logoImage?.alternativeText ?? 'Hovawart logo'
	const logoWidth = 156
	const logoHeight = 156

	const partnerLinks = globalLayout?.PartnerLink ?? []
	const footerContacts = (globalLayout?.Footer?.contacts ?? []).slice(0, 3)

	return (
		<footer
			style={{
				backgroundColor: theme.footerBackground,
				color: theme.textColor,
			}}
			className='w-full pt-1'
		>
			<div className='mx-auto w-full max-w-screen-xl px-4 py-8'>
				<div className='mb-8 grid gap-4 md:grid-cols-[minmax(7rem,0.8fr)_minmax(0,2.6fr)_minmax(8rem,1fr)]'>
					<div className='flex justify-center md:justify-start'>
						<div className='flex flex-col items-center gap-3'>
							{logoSrc ? (
								<Image
									src={logoSrc}
									alt={logoAlt}
									width={logoWidth}
									height={logoHeight}
									className='object-contain'
									unoptimized
									priority
								/>
							) : (
								<span className='text-lg font-semibold tracking-wide'>
									HZD
								</span>
							)}
							<SocialLinks
								socialLinkFB={globalLayout?.SocialLinkFB}
								socialLinkYT={globalLayout?.SocialLinkYT}
								socialLinkIG={globalLayout?.SocialLinkIG}
								theme={theme}
							/>
						</div>
					</div>
					<div>
						<div>
							<div className='grid grid-cols-1 gap-4 px-2 sm:grid-cols-3'>
								{footerContacts.map((contact) => (
									<div key={contact.documentId} className='text-center sm:text-left'>
										{contact.Headline ? (
											<p className='font-bold' style={{ color: theme.headerFooterIcons }}>
												{contact.Headline}
											</p>
										) : null}
										{contact.Name ? (
											<div className='text-sm'>{contact.Name}</div>
										) : null}
										{contact.Street ? (
											<div className='text-sm'>{contact.Street}</div>
										) : null}
										{contact.ZipCity ? (
											<div className='text-sm'>{contact.ZipCity}</div>
										) : null}
										{contact.Phone ? (
											<div className='text-sm'>{contact.Phone}</div>
										) : null}
									</div>
								))}
							</div>
							<hr
								style={{
									borderColor: 'var(--color-hzd-blau)',
									marginTop: '1rem',
									marginBottom: '1rem',
								}}
							/>
							<div className='mt-4 grid grid-cols-2 gap-2 px-2'>
								<div>
									<p className='text-sm'>TIK/IT-Support</p>
									<div className='text-sm'>{globalLayout?.Footer?.SupportEmail}</div>
								</div>
								<div>
									<div><Link href='/impressum' className='text-sm transition-colors hover:text-yellow-400 underline'>
										Impressum
									</Link></div>
									<div><Link href={resolveMediaUrl(globalLayout?.PrivacyPolicy, strapiBaseUrl) ?? '/datenschutz'} className='text-sm transition-colors hover:text-yellow-400 underline'>
										Datenschutz
									</Link></div>
									<div><Link href='/cookie-einstellungen' className='text-sm transition-colors hover:text-yellow-400 underline'>
										Cookie-Einstellungen
									</Link></div>
								</div>
							</div>
						</div>
					</div>
					<div>
						<p className='text-center font-semibold' style={{ color: theme.headerFooterIcons }}>
							Unsere Partner
						</p>
						<div className='flex flex-col items-center' style={{ gap: '1rem' }}>
							{partnerLinks.map((partnerLink, index) => {
								const logoUrl = resolveMediaUrl(partnerLink.Logo, strapiBaseUrl)
								const logoAlt = partnerLink.Logo?.alternativeText ?? partnerLink.AltText ?? 'Partner Logo'
								const isFirst = index === 0
								const isLast = index === partnerLinks.length - 1

								const imageElement = logoUrl ? (
									<Image
										src={logoUrl}
										alt={logoAlt}
										width={98}
										height={56}
										className='h-auto w-full max-w-[98px] object-contain'
										unoptimized
									/>
								) : (
									<span className='text-sm'>{logoAlt}</span>
								)

								return (
									<div
										key={partnerLink.id ?? index}
										className='flex justify-center'
										style={{
											marginTop: isFirst ? '0.5rem' : undefined,
											marginBottom: isLast ? '0.5rem' : undefined,
										}}
									>
										{partnerLink.PartnerLinkUrl ? (
											<Link
												href={partnerLink.PartnerLinkUrl}
												target='_blank'
												rel='noopener noreferrer'
											>
												{imageElement}
											</Link>
										) : (
											imageElement
										)}
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</div>
			<div
				className='w-full text-center'
				style={{
					backgroundColor: 'var(--color-copyright-background)',
				}}
			>
				<p
					style={{
						color: 'var(--color-copyright-text)',
						paddingTop: '.5em',
						paddingBottom: '.5em',
						fontSize: '0.875em',
					}}
				>
					©
					{' '}
					{currentYear}
					{' '}
					{globalLayout?.Copyright}
					{process.env.NEXT_PUBLIC_APP_VERSION && (
						<span style={{ marginLeft: '1em', opacity: 0.8 }}>
							<a href="/changelog">
								v{process.env.NEXT_PUBLIC_APP_VERSION}
							</a>
							{process.env.NEXT_PUBLIC_BUILD_DATE && (
								<span style={{ marginLeft: '0.5em' }}>
									({process.env.NEXT_PUBLIC_BUILD_DATE})
								</span>
							)}
						</span>
					)}
				</p>
			</div>
		</footer>
	)
}
