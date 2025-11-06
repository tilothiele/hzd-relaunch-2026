import Link from 'next/link'
import type { Homepage } from '@/types'

interface WelcomeSectionProps {
	homepage: Homepage
}

export function WelcomeSection({ homepage }: WelcomeSectionProps) {
	const { welcomeTitle, welcomeText, welcomeButtonText, welcomeButtonLink, welcomeBulletPoints } = homepage

	return (
		<section className="bg-[#f5f5f5] py-16">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-bold text-[#333333] mb-8">{welcomeTitle}</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="md:col-span-2">
						<div
							className="text-[#333333] mb-6 prose prose-lg max-w-none"
							dangerouslySetInnerHTML={{ __html: welcomeText || '' }}
						/>
						{welcomeButtonText && welcomeButtonLink && (
							<Link
								href={welcomeButtonLink}
								className="inline-block bg-yellow-400 text-[#3d2817] px-8 py-4 rounded font-semibold hover:bg-yellow-500 transition-colors"
							>
								{welcomeButtonText}
							</Link>
						)}
					</div>
					<div className="md:col-span-1">
						{welcomeBulletPoints && Array.isArray(welcomeBulletPoints) && (
							<ul className="space-y-4">
								{welcomeBulletPoints.map((point, index) => (
									<li key={index} className="flex items-start gap-3 text-[#333333]">
										<span className="text-[#1e8449] text-xl font-bold">→</span>
										<span>{point}</span>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}


