import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: { code?: string }
}) {
	const { globalLayout, baseUrl } = await fetchGlobalLayout()
	const theme = globalTheme

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle='Passwort zurücksetzen'
		>
			<SectionContainer>
				<ResetPasswordForm code={searchParams.code} />
			</SectionContainer>
		</MainPageStructure>
	)
}
