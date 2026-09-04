import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
	const { globalLayout, baseUrl } = await fetchGlobalLayout()
	const theme = globalTheme

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle='Passwort vergessen'
		>
			<SectionContainer>
				<ForgotPasswordForm />
			</SectionContainer>
		</MainPageStructure>
	)
}
