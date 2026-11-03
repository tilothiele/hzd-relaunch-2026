import type { Litter, PuppyAmount } from '@/types'

interface PuppyNoun {
	singular: string
	plural: string
}

export interface PuppyAvailabilityEntry {
	text: string
	className: string
}

export interface PuppyAvailabilityRow {
	key: string
	label: string
	entries: PuppyAvailabilityEntry[]
}

const COLOR_ROWS = [
	{ key: 'S', label: 'Schwarz', maleKey: 'AmountRS', femaleKey: 'AmountHS' },
	{ key: 'SM', label: 'Schwarzmarken', maleKey: 'AmountRSM', femaleKey: 'AmountHSM' },
	{ key: 'B', label: 'Blond', maleKey: 'AmountRB', femaleKey: 'AmountHB' },
] as const

const MALE_NOUN: PuppyNoun = { singular: 'Rüde', plural: 'Rüden' }
const FEMALE_NOUN: PuppyNoun = { singular: 'Hündin', plural: 'Hündinnen' }

function formatPuppyAvailability(
	amount: PuppyAmount | null | undefined,
	noun: PuppyNoun,
): PuppyAvailabilityEntry | null {
	const total = amount?.Total ?? 0
	const available = amount?.Available ?? 0

	if (total <= 0) {
		return null
	}

	const label = available === 1 ? noun.singular : noun.plural

	return {
		text: `${available} ${label} (von ${total})`,
		className: available > 0 ? 'text-green-700 font-bold' : 'text-gray-400',
	}
}

export function getPuppyAvailabilityRows(litter: Litter): PuppyAvailabilityRow[] {
	return COLOR_ROWS.flatMap(({ key, label, maleKey, femaleKey }) => {
		const entries = [
			formatPuppyAvailability(litter[maleKey], MALE_NOUN),
			formatPuppyAvailability(litter[femaleKey], FEMALE_NOUN),
		].filter((entry): entry is PuppyAvailabilityEntry => entry !== null)

		if (entries.length === 0) {
			return []
		}

		return [{ key, label, entries }]
	})
}

function AvailabilityEntries({ entries }: { entries: PuppyAvailabilityEntry[] }) {
	return (
		<div className='flex flex-col items-start gap-0.5 text-left'>
			{entries.map((entry) => (
				<span key={entry.text} className={entry.className}>
					{entry.text}
				</span>
			))}
		</div>
	)
}

export function PuppyAvailabilityCardRows({ rows }: { rows: PuppyAvailabilityRow[] }) {
	return (
		<>
			<tr className='border-t border-b border-gray-200'>
				<td colSpan={2} className='py-2 align-top font-bold'>
					Verfügbare Welpen:
				</td>
			</tr>
			{rows.map((row) => (
				<tr
					key={row.key}
					className='border-b border-gray-100 last:border-0'
				>
					<td className='w-[40%] py-2 align-top font-bold'>{row.label}</td>
					<td className='py-2 align-top'>
						<AvailabilityEntries entries={row.entries} />
					</td>
				</tr>
			))}
		</>
	)
}

export function PuppyAvailabilityDetail({ rows }: { rows: PuppyAvailabilityRow[] }) {
	return rows.map((row) => (
		<div
			key={row.key}
			className='flex items-start border-b border-gray-200 py-3 last:border-0'
		>
			<div className='w-1/3 font-semibold text-gray-700 md:w-1/4'>{row.label}</div>
			<div className='w-2/3 md:w-3/4'>
				<AvailabilityEntries entries={row.entries} />
			</div>
		</div>
	))
}
