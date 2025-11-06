import Image from 'next/image'
import Link from 'next/link'
import type { Homepage } from '@/types'

interface HeroProps {
	homepage: Homepage
}

export function Hero({ homepage }: HeroProps) {
	const { heroTitle, heroSubtitle, heroImage, heroButtonText, heroButtonLink } = homepage
	const imageUrl = heroImage?.data?.attributes?.url
		? `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${heroImage.data.attributes.url}`
		: '/placeholder-hero.jpg'

	return (
		<section className="relative w-full h-[600px] flex items-center justify-center">
			{imageUrl && (
				<Image
					src={imageUrl}
					alt={heroImage?.data?.attributes?.alternativeText || heroTitle}
					fill
					className="object-cover"
					priority
				/>
			)}
			<div className="absolute inset-0 bg-black/40" />
			<div className="relative z-10 container mx-auto px-4 text-center text-white">
				<h1 className="text-5xl md:text-6xl font-bold mb-4">{heroTitle}</h1>
				<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">{heroSubtitle}</p>
				{heroButtonText && heroButtonLink && (
					<Link
						href={heroButtonLink}
						className="inline-block bg-[#1e8449] text-white px-8 py-4 rounded font-semibold hover:bg-[#27ae60] transition-colors"
					>
						{heroButtonText}
					</Link>
				)}
			</div>
		</section>
	)
}


