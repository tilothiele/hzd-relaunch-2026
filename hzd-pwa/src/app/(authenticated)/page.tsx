import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export default async function Home() {
	const session = await getServerSession(authOptions)
	const strapiUrl = process.env.STRAPI_BASE_URL
	const displayName = session?.user?.name ?? session?.user?.email ?? 'Gast'

	return (
		<div className="flex flex-col items-center justify-center gap-8 py-8">
			<h1 className="text-4xl font-bold text-center">
				Willkommen, {displayName}!
			</h1>
			{strapiUrl && (
				<p>
					Backend URL:{' '}
					<code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
						{strapiUrl}
					</code>
				</p>
			)}
		</div>
	)
}
