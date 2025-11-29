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
				paddingTop: '1em',
			}}
			className='w-full'
		>
			<div className='mx-auto w-full max-w-screen-xl px-4 pb-8'>
				<div className='mb-8 grid gap-4 md:grid-cols-[1.5fr_2fr_1fr_0.5fr]'>
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
								style={{
									margin: 'auto',
								}}
							/>
							) : (
								<span className='text-lg font-semibold tracking-wide'>
									HZD
								</span>
							)}
					</div>
					<div>
						<div>
							<div className='grid grid-cols-2 gap-2'>
								<div>
									<h3 className='mb-2 font-bold'>Präsidium</h3>
									<p className='text-sm'>{globalLayout?.Footer?.PraesidiumName}</p>
									<p className='text-sm'>{globalLayout?.Footer?.PraesidiumOrt}</p>
									<p className='text-sm'>{globalLayout?.Footer?.PraesidiumTelefon}</p>
								</div>
								<div>
									<h3 className='mb-2 font-bold'>IT-Projektleitung</h3>
									<p className='text-sm'>{globalLayout?.Footer?.ItProjektleitungName}</p>
									<p className='text-sm'>{globalLayout?.Footer?.ItProjektleitungOrt}</p>
									<p className='text-sm'>{globalLayout?.Footer?.ItProjektleitungTelefon}</p>
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
									<SocialLinks socialLinkFB={globalLayout?.SocialLinkFB} socialLinkYT={globalLayout?.SocialLinkYT} />
								</div>
								<div>
									<ul className='space-y-2'>
										<li>
											<Link href='/impressum' className='text-sm transition-colors hover:text-yellow-400'>
												Impressum
											</Link>
										</li>
										<li>
											<Link href='/datenschutz' className='text-sm transition-colors hover:text-yellow-400'>
												Datenschutz
											</Link>
										</li>
										<li>
											<Link href='/cookie-einstellungen' className='text-sm transition-colors hover:text-yellow-400'>
												Cookie-Einstellungen
											</Link>
										</li>
									</ul>
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
										height={100}
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
									height={100}
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
						<h3
							className='text-center font-semibold'
							style={{ marginBottom: '0.5rem' }}
						>
							Unsere Partner
						</h3>
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
					color: '#0A0A0A',
					paddingTop: '.5em',
					paddingBottom: '.5em',
					fontSize: '0.875em',
				}}
			>
				<p>
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


