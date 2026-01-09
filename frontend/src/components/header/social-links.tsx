



import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faYoutube } from '@fortawesome/free-brands-svg-icons'
import type { ThemeDefinition } from '@/themes'

interface SocialLinksProps {
	socialLinkFB?: string | null
	socialLinkYT?: string | null
	theme: ThemeDefinition
}

export function SocialLinks({ socialLinkFB, socialLinkYT, theme }: SocialLinksProps) {
	const facebookHref = socialLinkFB ?? '#'
	const youtubeHref = socialLinkYT ?? '#'

	return (
		<>
			<a
				href={facebookHref}
				target='_blank'
				rel='noopener noreferrer'
			>
				<FontAwesomeIcon icon={faFacebookF} size='xl' style={{ color: theme.socialIcon }} />
			</a>
			<a
				href={youtubeHref}
				target='_blank'
				rel='noopener noreferrer'
			>
				<FontAwesomeIcon icon={faYoutube} size='xl' style={{ color: theme.socialIcon }} />
			</a>
		</>
	)
}