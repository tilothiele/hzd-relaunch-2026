import type { CSSProperties } from 'react'
import type { AiNote } from '@/types'

const AI_NOTE_LABELS: Record<AiNote, string> = {
	AiGenerated: 'KI-generiert',
	AiModified: 'KI-bearbeitet',
}

interface AiNoteLabelProps {
	note?: string | null
	/**
	 * Ab md liegt die Ecke auf einem hellen Verlauf.
	 * Darunter bleibt die Schrift hell, weil der Verlauf
	 * dort ausgeblendet ist.
	 */
	onLightFromMd?: boolean
	className?: string
	style?: CSSProperties
}

export function AiNoteLabel({
	note,
	onLightFromMd = false,
	className = '',
	style,
}: AiNoteLabelProps) {
	if (note !== 'AiGenerated' && note !== 'AiModified') {
		return null
	}

	const toneClass = onLightFromMd
		? 'text-white/90 [text-shadow:0_0_2px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.8)] md:text-neutral-600/80 md:[text-shadow:none]'
		: 'text-white/90 [text-shadow:0_0_2px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.8)]'

	return (
		<span
			className={[
				'pointer-events-none absolute bottom-2 left-2 z-30',
				'text-[11px] font-normal leading-none tracking-wide',
				toneClass,
				className,
			].join(' ')}
			style={style}
		>
			{AI_NOTE_LABELS[note]}
		</span>
	)
}
