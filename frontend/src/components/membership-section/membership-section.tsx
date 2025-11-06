import Link from 'next/link'
import type { Homepage } from '@/types'

interface MembershipSectionProps {
	homepage: Homepage
}

export function MembershipSection({ homepage }: MembershipSectionProps) {
	const { membershipTitle, membershipText, membershipButtonText, membershipButtonLink } = homepage

	return (
		<section className="bg-[#f5f5f5] py-16">
			<div className="container mx-auto px-4 text-center">
				<h2 className="text-4xl font-bold text-[#333333] mb-6">{membershipTitle}</h2>
				<div
					className="text-[#333333] mb-8 max-w-3xl mx-auto prose prose-lg"
					dangerouslySetInnerHTML={{ __html: membershipText || '' }}
				/>
				{membershipButtonText && membershipButtonLink && (
					<Link
						href={membershipButtonLink}
						className="inline-block bg-yellow-400 text-[#3d2817] px-8 py-4 rounded font-semibold hover:bg-yellow-500 transition-colors"
					>
						{membershipButtonText}
					</Link>
				)}
			</div>
		</section>
	)
}


