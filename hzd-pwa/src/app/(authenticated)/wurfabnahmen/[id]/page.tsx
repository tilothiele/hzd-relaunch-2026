import { WurfabnahmeEditor } from '@/components/wurfabnahme/WurfabnahmeEditor'

export default async function WurfabnahmeDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	return (
		<WurfabnahmeEditor
			basePath={`/wurfabnahmen/${id}`}
			recordId={id}
		/>
	)
}
