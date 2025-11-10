



import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faYoutube } from '@fortawesome/free-brands-svg-icons'

interface SocialLinksProps {
	socialLinkFB?: string | null
	socialLinkYT?: string | null
}

export function SocialLinks({ socialLinkFB, socialLinkYT }: SocialLinksProps) {
	const facebookHref = socialLinkFB ?? '#'
	const youtubeHref = socialLinkYT ?? '#'

	return (
		<>
			<a
				href={facebookHref}
				target='_blank'
				rel='noopener noreferrer'
				className='transition-colors hover:text-yellow-400'
				aria-label='Facebook'
			>
				<FontAwesomeIcon icon={faFacebookF} size='xl' style={{ color: '#FAD857' }} />
			</a>
			<a
				href={youtubeHref}
				target='_blank'
				rel='noopener noreferrer'
				className='transition-colors hover:text-yellow-400'
				aria-label='YouTube'
			>
				<FontAwesomeIcon icon={faYoutube} size='xl' style={{ color: '#FAD857' }} />
			</a>
		</>
	)
}