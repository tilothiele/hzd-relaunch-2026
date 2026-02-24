



import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faYoutube } from '@fortawesome/free-brands-svg-icons'
import type { ThemeDefinition } from '@/themes'

interface SocialLinksProps {
	socialLinkFB?: string | null
	theme: ThemeDefinition
}

export function SocialLinks({ socialLinkFB, theme }: SocialLinksProps) {
	const facebookHref = socialLinkFB ?? '#'

	return (
		<>
			<a
				href={facebookHref}
				target='_blank'
				rel='noopener noreferrer'
			>
				<FontAwesomeIcon icon={faFacebookF} size='xl' style={{ color: theme.socialIcon }} />
			</a>
		</>
	)
}