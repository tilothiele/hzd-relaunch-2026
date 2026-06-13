import { KoerungVeranstaltungEditor } from '@/components/koerung/KoerungVeranstaltungEditor'

export default async function KoerungVeranstaltungDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	return <KoerungVeranstaltungEditor veranstaltungId={id} />
}
