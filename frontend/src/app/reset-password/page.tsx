import { MainPageStructure } from '../main-page-structure'
import { ResetPasswordForm } from '@/components/reset-password/reset-password-form'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'

export const dynamic = 'force-dynamic'

interface ResetPasswordPageProps {
	searchParams: Promise<{ code?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.B
	const pageTitle = 'Passwort ändern'
	const params = await searchParams
	const code = params.code

	if (error) {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
				</div>
			</MainPageStructure>
		)
	}

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			<SectionContainer variant='max-width'>
				<div className='flex min-h-[50vh] items-center justify-center py-12'>
					<div className='w-full max-w-md'>
						<ResetPasswordForm code={code} strapiBaseUrl={baseUrl} />
					</div>
				</div>
			</SectionContainer>
		</MainPageStructure>
	)
}




