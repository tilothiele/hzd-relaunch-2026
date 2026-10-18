import { cookies } from 'next/headers'
import { STRAPI_JWT_COOKIE } from '@/lib/auth-cookie'
import { fetchMe, formatAuthDisplayName } from '@/lib/strapi-api'

export default async function Home() {
	const cookieStore = await cookies()
	const token = cookieStore.get(STRAPI_JWT_COOKIE)?.value
	const user = token ? await fetchMe(token).catch(() => null) : null
	const strapiUrl = process.env.STRAPI_BASE_URL
	const displayName = formatAuthDisplayName(user)

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
