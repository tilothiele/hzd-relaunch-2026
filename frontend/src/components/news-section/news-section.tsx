import Image from 'next/image'
import Link from 'next/link'
import type { NewsArticle } from '@/types'

interface NewsSectionProps {
	articles: NewsArticle[]
}

export function NewsSection({ articles }: NewsSectionProps) {
	const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'

	return (
		<section className="bg-[#f5f5f5] py-16">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{articles.slice(0, 2).map((article) => {
						const imageUrl = article.attributes.image?.data?.attributes?.url
							? `${strapiUrl}${article.attributes.image.data.attributes.url}`
							: '/placeholder-news.jpg'

						return (
							<article key={article.id} className="bg-white rounded-lg overflow-hidden shadow-md">
								<div className="relative h-48">
									{imageUrl && (
										<Image
											src={imageUrl}
											alt={article.attributes.image?.data?.attributes?.alternativeText || article.attributes.title}
											fill
											className="object-cover"
										/>
									)}
									{article.attributes.category && (
										<span className="absolute top-4 right-4 bg-yellow-400 text-[#3d2817] px-3 py-1 rounded text-sm font-semibold">
											{article.attributes.category.toUpperCase()}
										</span>
									)}
								</div>
								<div className="p-6">
									<h3 className="text-xl font-bold mb-3 text-[#333333]">{article.attributes.title}</h3>
									<p className="text-[#666666] mb-4">{article.attributes.excerpt}</p>
									<Link
										href={`/news/${article.attributes.slug}`}
										className="text-[#1e8449] font-semibold hover:underline"
									>
										WEITERLESEN &gt;
									</Link>
								</div>
							</article>
						)
					})}
				</div>
			</div>
		</section>
	)
}


