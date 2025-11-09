'use client'

import Link from 'next/link'
import { Startpage } from '@/types'
import Image from 'next/image'
import type { ThemeDefinition } from '@/themes'
import { SocialLinks } from '../header/social-links'
import { resolveMediaUrl } from '../header/logo-utils'

interface FooterProps {
	startpage: Startpage
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function Footer({ startpage, strapiBaseUrl, theme }: FooterProps) {
	const currentYear = new Date().getFullYear()

	const logoImage = startpage?.Logo

	const logoSrc = resolveMediaUrl(logoImage, strapiBaseUrl) ?? ''
	const logoAlt = logoImage?.alternativeText ?? 'Hovawart logo'
	const logoWidth = logoImage?.width ?? 200
	const logoHeight = logoImage?.height ?? 100

	const magaizinImage = startpage?.UnserHovawartImage

	const magazinSrc = resolveMediaUrl(magaizinImage, strapiBaseUrl) ?? ''
	const magazinAlt = magaizinImage?.alternativeText ?? 'Hovawart Magazin'
	const magazinWidth = magaizinImage?.width ?? 200
	const magazinHeight = magaizinImage?.height ?? 100

	return (
		<footer
			className='pt-12 pb-4'
			style={{ backgroundColor: theme.footerBackground, color: theme.textColor }}
		>
			<div className='container mx-auto px-4'>
				<div className='mb-8 grid gap-4 md:grid-cols-4'>
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
							<div className='grid grid-cols-2 gap-2 space-y-4'>
								<div>
									<h4 className='mb-2 font-semibold'>Präsidium</h4>
									<p className='text-sm'>Claudia von Brill</p>
									<p className='text-sm'>Adresse, Telefon</p>
								</div>
								<div>
									<h4 className='mb-2 font-semibold'>IT-Projektleitung</h4>
									<p className='text-sm'>Judith Reinicke</p>
									<p className='text-sm'>Adresse, Telefon</p>
								</div>
							</div>
							<hr className='border-yellow' />
							<div className='mt-4 grid grid-cols-2 gap-2 space-y-4'>
								<div className='flex gap-4'>
									<SocialLinks socialLinkFB={startpage.SocialLinkFB} socialLinkYT={startpage.SocialLinkYT} />
								</div>
								<div>
									<h4 className='mb-4 font-semibold'>Rechtliches</h4>
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
						<h4 className='mb-4 font-semibold'>Unsere Partner</h4>
						<div className='space-y-4'>
							<div>
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
							<div>
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
							<div>
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
				<div className='border-t border-yellow pt-4 text-center text-sm text-gray-300'>
					<p>© {currentYear} {startpage.Copyright}</p>
				</div>
			</div>
		</footer>
	)
}


