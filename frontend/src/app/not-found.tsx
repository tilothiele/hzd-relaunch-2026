const wrapperClasses = [
	'flex',
	'min-h-screen',
	'w-full',
	'flex-col',
	'items-center',
	'justify-center',
	'gap-6',
	'px-6',
	'py-24',
	'text-center',
	'bg-neutral-50',
].join(' ')

const headingClasses = [
	'text-4xl',
	'font-semibold',
	'tracking-tight',
	'text-neutral-900',
].join(' ')

const textClasses = ['text-base', 'text-neutral-600', 'max-w-lg'].join(' ')

export default function NotFound() {
	return (
		<main className={wrapperClasses}>
			<h1 className={headingClasses}>
				Seite nicht gefunden
			</h1>
			<p className={textClasses}>
				Die angeforderte Seite konnte nicht gefunden werden. Bitte prüfen Sie die
				URL oder kehren Sie zur Startseite zurück.
			</p>
		</main>
	)
}




