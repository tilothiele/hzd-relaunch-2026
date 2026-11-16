import KoerungAusschreibungForm from '@/components/koerung-ausschreibung/koerung-ausschreibung-form'

export const metadata = {
	title: 'Ausschreibung HZD-Körung',
	description:
		'Ausschreibung einer HZD-Körung als DOCX und PDF generieren.',
}

export default function KoerungAusschreibungPage() {
	return <KoerungAusschreibungForm />
}
