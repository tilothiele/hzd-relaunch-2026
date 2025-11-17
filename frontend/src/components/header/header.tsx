'use client'

import type { MenuItem, AuthUser, GlobalLayout } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Image from 'next/image'
import Link from 'next/link'
import {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { SocialLinks } from './social-links'
import { LoginControls } from './login-controls'
import { resolveMediaUrl } from './logo-utils'

interface LoginCredentials {
	identifier: string
	password: string
}

interface HeaderProps {
	globalLayout: GlobalLayout | null | undefined
	strapiBaseUrl: string
	theme: ThemeDefinition
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: (credentials: LoginCredentials) => Promise<void>
	onLogout: () => void
	isAuthenticating: boolean
	error?: string | null
	pageTitle?: string | null
}

const FALLBACK_MENU_URL = '#'

function MenuContentList({
	items,
	theme,
}: {
	items: MenuItem[]
	theme: ThemeDefinition
}) {
	return (
		<div
			className='flex flex-col gap-4'
			style={{
				color: theme.textColor,
			}}
		>
			{items.map((child) => {
				const key = child.url ?? child.name
				const hasNestedChildren = Boolean(child.children?.length)

				if (hasNestedChildren) {
					return (
						<div
							key={key}
							className='flex flex-col gap-2'
						>
							<p className='text-lg font-semibold'>
								{child.name}
							</p>
							<ul className='space-y-1'>
								{child.children?.map((grandchild) => (
									<li key={grandchild.url ?? grandchild.name}>
										<NavigationMenuLink asChild>
											<Link
												href={grandchild.url ?? FALLBACK_MENU_URL}
												className='block rounded px-2 py-1 text-base transition-colors hover:text-yellow-400'
											>
												{grandchild.name}
											</Link>
										</NavigationMenuLink>
									</li>
								))}
							</ul>
						</div>
					)
				}

				return (
					<NavigationMenuLink
						key={key}
						asChild
					>
						<Link
							href={child.url ?? FALLBACK_MENU_URL}
							className='block rounded px-2 py-1 text-base transition-colors hover:text-yellow-400'
						>
							{child.name}
						</Link>
					</NavigationMenuLink>
				)
			})}
		</div>
	)
}


export function Header({
	globalLayout,
	strapiBaseUrl,
	theme,
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
	pageTitle,
}: HeaderProps) {

//	console.log(globalLayout)

	const logoSrc = resolveMediaUrl(globalLayout?.Logo, strapiBaseUrl ?? '')
	const logoAlt = globalLayout?.Logo?.alternativeText ?? 'HZD Logo'
	const menuItems = globalLayout?.Menu?.items ?? []
	const logoWidth = 150
	const logoHeight = 150

	return (
		<header
			style={{
				backgroundColor: theme.headerBackground,
				color: theme.headerFooterTextColor,
			}}
			className='w-full'
		>
			<nav className='flex w-full items-center px-6 py-3'>
				<div className='flex flex-1 justify-center'>
					<Link
						href='/'
						className='flex items-center justify-center transition-opacity hover:opacity-80'
						aria-label='Zur Startseite'
					>
						{logoSrc ? (
							<Image
								src={logoSrc}
								alt={logoAlt}
								width={logoWidth}
								height={logoHeight}
								className='object-contain'
								unoptimized
								priority
								style={{ margin: 'auto' }}
							/>
						) : (
							<span className='text-lg font-semibold tracking-wide text-center'>
								HZD
							</span>
						)}
					</Link>
				</div>
				<NavigationMenu className='flex flex-1 justify-center text-xl'>
					<NavigationMenuList>
						{menuItems.map((item) => {
							const hasChildren = Boolean(item.children?.length)
							const itemKey = item.url ?? item.name

							return (
								<NavigationMenuItem key={itemKey}>
									{hasChildren ? (
										<>
											<NavigationMenuTrigger className='bg-transparent text-inherit'>
												{item.name}
											</NavigationMenuTrigger>
											<NavigationMenuContent
												style={{
													backgroundColor: '#F2F5F7',
													color: theme.textColor,
													marginTop: '0.5rem',
													padding: '1.5rem',
													borderRadius: '0.5rem',
													border: '1px solid rgba(0, 0, 0, 0.08)',
												}}
											>
												<MenuContentList
													items={item.children!}
													theme={theme}
												/>
											</NavigationMenuContent>
										</>
									) : item.url ? (
										<NavigationMenuLink asChild>
											<Link
												href={item.url}
												className='inline-flex items-center px-3 py-2 text-xl font-medium transition-colors hover:text-yellow-400'
											>
												{item.name}
											</Link>
										</NavigationMenuLink>
									) : (
										<span className='inline-flex items-center px-3 py-2 text-xl font-medium'>
											{item.name}
										</span>
									)}
								</NavigationMenuItem>
							)
						})}
					</NavigationMenuList>
				</NavigationMenu>
				<div className='flex flex-1 items-center justify-center gap-4'>
					<SocialLinks
						socialLinkFB={globalLayout?.SocialLinkFB}
						socialLinkYT={globalLayout?.SocialLinkYT}
					/>
					<LoginControls
						isAuthenticated={isAuthenticated}
						user={user}
						onLogin={onLogin}
						onLogout={onLogout}
						isAuthenticating={isAuthenticating}
						error={error}
						theme={theme}
					/>
				</div>
			</nav>
			{pageTitle ? (
			<div className='flex w-full justify-end'>
				<span style={{ marginRight: '20vw', fontSize: '2em' }}>{pageTitle}</span>
			</div>) : null}
		</header>
	)
}
