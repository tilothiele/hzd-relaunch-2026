import { menu } from '@/lib/globals'
import type { MenuItem, Startpage } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

const baseLinkClass =
	'flex items-center gap-1 transition-colors hover:text-yellow-400'

const dropdownListClass = [
	'absolute',
	'left-0',
	'mt-2',
	'hidden',
	'w-40',
	'rounded',
	'bg-[#3d2817]',
	'py-2',
	'shadow-lg',
	'group-hover:block',
].join(' ')

function resolveLogoUrl(logo?: Startpage['logo']) {
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
	const logoSrc = resolveLogoUrl(startpage?.logo)
	const logoAlt =
		startpage?.logo?.alternativeText ??
		startpage?.logo?.url ??
		'HZD Logo'
	const logoWidth = startpage?.logo?.width ?? 120
	const logoHeight = startpage?.logo?.height ?? 48

	console.log(logoSrc, logoAlt, logoWidth, logoHeight)
	return (
		<header className="bg-[#3d2817] text-white">
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
					{menu.items.map(renderMenuItem)}
					<li className="ml-auto flex items-center gap-4">
						<a
							href="https://facebook.com"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-yellow-400"
							aria-label="Facebook"
						>
							<svg
								className="h-5 w-5"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
							</svg>
						</a>
						<a
							href="https://instagram.com"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-yellow-400"
							aria-label="Instagram"
						>
							<svg
								className="h-5 w-5"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
							</svg>
						</a>
					</li>
				</ul>
			</nav>
		</header>
	)
}


