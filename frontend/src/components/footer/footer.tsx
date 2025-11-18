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

	const magaizinImage = globalLayout?.UnserHovawartImage

	const magazinSrc = resolveMediaUrl(magaizinImage, strapiBaseUrl) ?? ''
	const magazinAlt = magaizinImage?.alternativeText ?? 'Hovawart Magazin'
	const magazinWidth = 200
	const magazinHeight = 100

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
						{magazinSrc ? (
							<Image
								src={magazinSrc}
								alt={magazinAlt}
								width={magazinWidth}
								height={magazinHeight}
								className='object-contain'
								unoptimized
								priority
								style={{
									margin: 'auto',
								}}
							/>
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
							<div className='flex justify-center' style={{ marginTop: '0.5rem' }}>
								<Image
									src='/logos/HZD_Shop-hovawart-zuchgemeinschaft.png'
									alt='VDH Logo'
									width={100}
									height={300}
									className='object-contain'
									unoptimized
									priority
								/>
							</div>
							<div className='flex justify-center'>
								<Image
									src='/logos/FCI-federal-cynologique-internationale-hzd-hovawart.png'
									alt='FCI Logo'
									width={100}
									height={100}
									className='object-contain'
									unoptimized
									priority
								/>
							</div>
							<div className='flex justify-center' style={{ marginBottom: '0.5rem' }}>
								<Image
									src='/logos/verband-deutsches-hundewesen-hzd-hovawart.png'
									alt='VDH Logo'
									width={100}
									height={100}
									className='object-contain'
									unoptimized
									priority
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className='w-full text-center'
				style={{
					backgroundColor: '#FAD857',
					color: '#0A0A0A',
					borderTop: '1px solid',
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


