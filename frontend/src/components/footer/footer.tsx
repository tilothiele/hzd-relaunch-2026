import Link from 'next/link'
import { Startpage } from '@/types'
import Image from 'next/image'
import { SocialLinks } from '../header/social-links'
import { resolveLogoUrl } from '../header/header'
interface FooterProps {
	startpage: Startpage
}

export function Footer({ startpage }: FooterProps) {
	const currentYear = new Date().getFullYear()

	const logoImage = startpage?.Logo

	const logoSrc = resolveLogoUrl(logoImage) ?? ''
	const logoAlt = logoImage?.alternativeText ?? 'Hovawart logo'
	const logoWidth = logoImage?.width ?? 200
	const logoHeight = logoImage?.height ?? 100

	const magaizinImage = startpage?.UnserHovawartImage

	const magazinSrc = resolveLogoUrl(magaizinImage) ?? ''
	const magazinAlt = magaizinImage?.alternativeText ?? 'Hovawart Magazin'
	const magazinWidth = magaizinImage?.width ?? 200
	const magazinHeight = magaizinImage?.height ?? 100

	return (
		<footer className="bg-[#64574E] text-white py-12">
			<div className="container mx-auto px-4">
				<div className="grid md:grid-cols-4 gap-4 mb-8">
					<div>
						{logoSrc ? (
								<Image
									src={logoSrc}
									alt={logoAlt}
									width="200"
									height="200"
									className="object-contain"
									unoptimized
									priority
									style={{
										margin: 'auto',
									}}
								/>
							) : (
								<span className="text-lg font-semibold tracking-wide">
									HZD
								</span>
							)}
					</div>
					<div>
						<div>
							<div className="grid md:grid-cols-2 gap-2 space-y-4">
								<div>
									<h4 className="font-semibold mb-2">Präsidium</h4>
									<p className="text-sm">Claudia von Brill</p>
									<p className="text-sm">Adresse, Telefon</p>
								</div>
								<div>
									<h4 className="font-semibold mb-2">IT-Projektleitung</h4>
									<p className="text-sm">Judith Reinicke</p>
									<p className="text-sm">Adresse, Telefon</p>
								</div>
							</div>
							<div className="grid md:grid-cols-2 gap-2 space-y-4 mt-4">
								<div className="flex gap-4 mt-4">
									<SocialLinks socialLinkFB={startpage.SocialLinkFB} socialLinkYT={startpage.SocialLinkYT} />
								</div>
								<div>
									<h4 className="font-semibold mb-4">Rechtliches</h4>
									<ul className="space-y-2">
										<li>
											<Link href="/impressum" className="text-sm hover:text-yellow-400 transition-colors">
												Impressum
											</Link>
										</li>
										<li>
											<Link href="/datenschutz" className="text-sm hover:text-yellow-400 transition-colors">
												Datenschutz
											</Link>
										</li>
										<li>
											<Link href="/cookie-einstellungen" className="text-sm hover:text-yellow-400 transition-colors">
												Cookie-Einstellungen
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div>
								<Image
										src={magazinSrc}
										alt="Hovawart Magazin"
										width="200"
										height="200"
										className="object-contain"
										unoptimized
										priority
									/>
					</div>
					<div>
						<h4 className="font-semibold mb-4">Unsere Partner</h4>
						<div className="space-y-4">
							<div>
								<Image
										src="/logos/HZD_Shop-hovawart-zuchgemeinschaft.png"
										alt="VDH Logo"
										width="100"
										height="300"
										className="object-contain"
										unoptimized
										priority
									/>
							</div>
							<div>
								<Image
										src="/logos/FCI-federal-cynologique-internationale-hzd-hovawart.png"
										alt="FCI Logo"
										width="100"
										height="100"
										className="object-contain"
										unoptimized
										priority
									/>
							</div>
							<div>
								<Image
										src="/logos/verband-deutsches-hundewesen-hzd-hovawart.png"
										alt="VDH Logo"
										width="100"
										height="100"
										className="object-contain"
										unoptimized
										priority
									/>
							</div>
						</div>
					</div>
				</div>
				<div className="border-t border-[#5a3d2a] pt-4 text-center text-sm text-gray-300">
					<p>© {currentYear} {startpage.Copyright}</p>
				</div>
			</div>
		</footer>
	)
}


