import Link from 'next/link'
import type { HomepageSection } from '@/types'

interface InfoBlocksProps {
	sections: HomepageSection[]
}

export function InfoBlocks({ sections }: InfoBlocksProps) {
	const colors = [
		{ bg: 'bg-[#3d2817]', text: 'text-white', button: 'bg-yellow-400 text-[#3d2817]' },
		{ bg: 'bg-[#8e44ad]', text: 'text-white', button: 'bg-white text-[#8e44ad]' },
		{ bg: 'bg-[#1e8449]', text: 'text-white', button: 'bg-white text-[#1e8449]' },
	]

	return (
		<section className="grid grid-cols-1 md:grid-cols-3 gap-0">
			{sections.slice(0, 3).map((section, index) => {
				const colorScheme = colors[index] || colors[0]
				return (
					<div
						key={section.id}
						className={`${colorScheme.bg} ${colorScheme.text} p-8 flex flex-col justify-between min-h-[300px]`}
					>
						<div>
							<h2 className="text-2xl font-bold mb-4">{section.attributes.title}</h2>
							<p className="mb-6">{section.attributes.text}</p>
						</div>
						{section.attributes.buttonText && section.attributes.buttonLink && (
							<Link
								href={section.attributes.buttonLink}
								className={`${colorScheme.button} px-6 py-3 rounded font-semibold text-center hover:opacity-90 transition-opacity inline-block`}
							>
								{section.attributes.buttonText}
							</Link>
						)}
					</div>
				)
			})}
		</section>
	)
}


