import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl?: string }>
}) {
	const resolvedSearchParams = await searchParams
	const { globalLayout, baseUrl } = await fetchGlobalLayout()
	const theme = globalTheme

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle='Anmelden'
		>
			<SectionContainer>
				<LoginForm callbackUrl={resolvedSearchParams.callbackUrl} />
			</SectionContainer>
		</MainPageStructure>
	)
}
