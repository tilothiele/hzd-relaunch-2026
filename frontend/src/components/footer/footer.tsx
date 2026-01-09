'use client'

import Link from 'next/link'
import type { GlobalLayout } from '@/types'
import Image from 'next/image'
import type { ThemeDefinition } from '@/themes'
import { SocialLinks } from '../header/social-links'
import { resolveMediaUrl } from '../header/logo-utils'

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
	const logoWidth = 150
	const logoHeight = 150

	const partnerLinks = globalLayout?.PartnerLink ?? []
	const firstPartnerLink = partnerLinks[0]
	const remainingPartnerLinks = partnerLinks.slice(1, 4) // Nimm die nächsten 3 Partner-Links

	return (
		<footer
			style={{
				backgroundColor: theme.footerBackground,
				color: theme.headerFooterTextColor,
			}}
			className='w-full pt-1'
		>
			<div className='mx-auto w-full max-w-screen-xl px-4 py-8'>
				<div className='mb-8 grid gap-4 md:grid-cols-[1.5fr_2fr_1fr_1fr]'>
					<div>
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
					</div>
					<div>
						<div>
							<div className='grid grid-cols-2 gap-2 px-2'>
								<div>
									<p className='font-bold' style={{ color: theme.headerFooterTextColor }}>Präsidium</p>
									<div className='text-sm'>{globalLayout?.Footer?.PraesidiumName}</div>
									<div className='text-sm'>{globalLayout?.Footer?.PraesidiumOrt}</div>
									<div className='text-sm'>{globalLayout?.Footer?.PraesidiumTelefon}</div>
								</div>
								<div>
									<p className='font-bold' style={{ color: theme.headerFooterTextColor }}>IT-Projektleitung</p>
									<div className='text-sm'>{globalLayout?.Footer?.ItProjektleitungName}</div>
									<div className='text-sm'>{globalLayout?.Footer?.ItProjektleitungOrt}</div>
									<div className='text-sm'>{globalLayout?.Footer?.ItProjektleitungTelefon}</div>
								</div>
							</div>
							<hr
								style={{
									borderColor: '#FAD857',
									marginTop: '1rem',
									marginBottom: '1rem',
								}}
							/>
							<div className='mt-4 grid grid-cols-2 gap-2'>
								<div className='flex justify-center gap-4'>
									<SocialLinks socialLinkFB={globalLayout?.SocialLinkFB} socialLinkYT={globalLayout?.SocialLinkYT} theme={theme} />
								</div>
								<div>
									<div><Link href='/impressum' className='text-sm transition-colors hover:text-yellow-400 underline'>
										Impressum
									</Link></div>
									<div><Link href='/datenschutz' className='text-sm transition-colors hover:text-yellow-400 underline'>
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
						{firstPartnerLink?.Logo ? (
							firstPartnerLink.PartnerLinkUrl ? (
								<Link
									href={firstPartnerLink.PartnerLinkUrl}
									rel='noopener noreferrer'
									style={{
										display: 'block',
										margin: 'auto',
									}}
								>
									<Image
										src={resolveMediaUrl(firstPartnerLink.Logo, strapiBaseUrl) ?? ''}
										alt={firstPartnerLink.Logo.alternativeText ?? firstPartnerLink.AltText ?? 'Partner Logo'}
										width={200}
										height={300}
										className='object-contain'
										unoptimized
										priority
										style={{
											margin: 'auto',
										}}
									/>
								</Link>
							) : (
								<Image
									src={resolveMediaUrl(firstPartnerLink.Logo, strapiBaseUrl) ?? ''}
									alt={firstPartnerLink.Logo.alternativeText ?? firstPartnerLink.AltText ?? 'Partner Logo'}
									width={200}
									height={300}
									className='object-contain'
									unoptimized
									priority
									style={{
										margin: 'auto',
									}}
								/>
							)
						) : null}
					</div>
					<div>
						<p className='text-center font-semibold' style={{ color: theme.headerFooterTextColor }}>
							Unsere Partner
						</p>
						<div className='flex flex-col items-center' style={{ gap: '1rem' }}>
							{remainingPartnerLinks.map((partnerLink, index) => {
								if (!partnerLink.Logo) return null

								const logoUrl = resolveMediaUrl(partnerLink.Logo, strapiBaseUrl) ?? ''
								const logoAlt = partnerLink.Logo.alternativeText ?? partnerLink.AltText ?? 'Partner Logo'
								const isFirst = index === 0
								const isLast = index === remainingPartnerLinks.length - 1

								const imageElement = (
									<Image
										src={logoUrl}
										alt={logoAlt}
										width={100}
										height={100}
										className='object-contain'
										unoptimized
										priority
									/>
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
					backgroundColor: '#FAD857',
				}}
			>
				<p
					style={{
						color: '#0A0A0A',
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
				</p>
			</div>
		</footer>
	)
}
