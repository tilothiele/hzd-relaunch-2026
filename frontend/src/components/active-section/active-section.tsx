import Link from 'next/link'
import type { HomepageSection } from '@/types'

interface ActiveSectionProps {
	sections: HomepageSection[]
}

export function ActiveSection({ sections }: ActiveSectionProps) {
	const activeSections = sections.filter((s) => s.attributes.title.includes('Hovis') || s.attributes.title.includes('TIK'))

	return (
		<section className="bg-[#f5f5f5] py-16">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-bold text-[#333333] mb-8">Aktiv für unsere Hovawarte</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{activeSections.map((section) => (
						<div key={section.id} className="bg-white p-8 rounded-lg shadow-md">
							<h3 className="text-2xl font-bold mb-4 text-[#333333]">{section.attributes.title}</h3>
							<p className="text-[#666666] mb-6">{section.attributes.text}</p>
							{section.attributes.buttonText && section.attributes.buttonLink && (
								<Link
									href={section.attributes.buttonLink}
									className="inline-flex items-center gap-2 bg-yellow-400 text-[#3d2817] px-6 py-3 rounded font-semibold hover:bg-yellow-500 transition-colors"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									{section.attributes.buttonText}
								</Link>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}


