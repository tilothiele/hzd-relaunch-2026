import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faFacebookF,
	faInstagram,
	faYoutube,
} from '@fortawesome/free-brands-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { ThemeDefinition } from '@/themes'

interface SocialLinksProps {
	socialLinkFB?: string | null
	socialLinkYT?: string | null
	socialLinkIG?: string | null
	theme: ThemeDefinition
}

interface SocialLinkItem {
	href: string
	icon: IconDefinition
	label: string
}

export function SocialLinks({
	socialLinkFB,
	socialLinkYT,
	socialLinkIG,
	theme,
}: SocialLinksProps) {
	const links: SocialLinkItem[] = [
		socialLinkFB
			? { href: socialLinkFB, icon: faFacebookF, label: 'Facebook' }
			: null,
		socialLinkYT
			? { href: socialLinkYT, icon: faYoutube, label: 'YouTube' }
			: null,
		socialLinkIG
			? { href: socialLinkIG, icon: faInstagram, label: 'Instagram' }
			: null,
	].filter((link): link is SocialLinkItem => link !== null)

	if (links.length === 0) {
		return null
	}

	return (
		<div className='flex items-center justify-center gap-4'>
			{links.map((link) => (
				<a
					key={link.label}
					href={link.href}
					target='_blank'
					rel='noopener noreferrer'
					aria-label={link.label}
				>
					<FontAwesomeIcon
						icon={link.icon}
						size='xl'
						style={{ color: theme.socialIcon }}
					/>
				</a>
			))}
		</div>
	)
}
