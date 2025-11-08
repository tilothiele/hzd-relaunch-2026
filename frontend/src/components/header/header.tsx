import type { MenuItem, Startpage } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { SocialLinks } from './social-links'

const baseLinkClass =
	'flex items-center gap-1 transition-colors hover:text-yellow-400'

const dropdownListClass = [
	'absolute',
	'left-0',
	'mt-2',
	'hidden',
	'w-40',
	'rounded',
	'bg-[#64574E]',
	'py-2',
	'shadow-lg',
	'group-hover:block',
].join(' ')

export function resolveLogoUrl(logo?: Startpage['Logo']) {
	const logoPath = logo?.url

	if (!logoPath) {
		return null
	}

	const baseUrl = process.env.NEXT_PUBLIC_STRAPI_BASE_URL ?? ''

	if (/^https?:\/\//.test(logoPath)) {
		return logoPath
	}

	if (!baseUrl) {
		return logoPath
	}

	try {
		const resolvedUrl = new URL(logoPath, baseUrl)

		if (resolvedUrl.searchParams.has('url')) {
			resolvedUrl.searchParams.delete('url')
		}

		return resolvedUrl.toString()
	} catch {
		return logoPath
	}
}

function renderMenuItem(item: MenuItem) {
	const hasChildren = Boolean(item.children?.length)
	const key = item.url ?? item.name

	return (
		<li
			key={key}
			className={hasChildren ? 'relative group' : undefined}
		>
			{item.url ? (
				<Link href={item.url} className={baseLinkClass}>
					{item.name}
					{hasChildren ? (
						<span className="text-xs" aria-hidden="true">
							▼
						</span>
					) : null}
				</Link>
			) : (
				<span className={baseLinkClass}>
					{item.name}
					{hasChildren ? (
						<span className="text-xs" aria-hidden="true">
							▼
						</span>
					) : null}
				</span>
			)}
			{hasChildren ? (
				<ul className={dropdownListClass}>
					{item.children?.map(renderMenuItem)}
				</ul>
			) : null}
		</li>
	)
}

interface HeaderProps {
	startpage: Startpage
}

export function Header({ startpage }: HeaderProps) {
	const logoSrc = resolveLogoUrl(startpage?.Logo)
	const logoAlt =
		startpage?.Logo?.alternativeText ??
		startpage?.Logo?.url ??
		'HZD Logo'
	const logoWidth = startpage?.Logo?.width ?? 120
	const logoHeight = startpage?.Logo?.height ?? 48

	console.log(logoSrc, logoAlt, logoWidth, logoHeight)
	return (
		<header className="bg-[#64574E] text-white">
			<nav className="container mx-auto px-4 py-3">
				<ul className="flex items-center gap-6 text-sm">
					<li>
						<Link
							href="/"
							className="flex items-center transition-opacity hover:opacity-80"
							aria-label="Zur Startseite"
						>
							{logoSrc ? (
								<Image
									src={logoSrc}
									alt={logoAlt}
									width={logoWidth}
									height={logoHeight}
									className="object-contain"
									style={{
										height: '3rem',
										width: 'auto',
									}}
									unoptimized
									priority
								/>
							) : (
								<span className="text-lg font-semibold tracking-wide">
									HZD
								</span>
							)}
						</Link>
					</li>
					{(startpage.Menu?.items ?? []).map(renderMenuItem)}
					<li className="ml-auto flex items-center gap-4">
						<SocialLinks socialLinkFB={startpage.SocialLinkFB} socialLinkYT={startpage.SocialLinkYT} />
					</li>
				</ul>
			</nav>
		</header>
	)
}


