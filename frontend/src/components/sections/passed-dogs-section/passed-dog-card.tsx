'use client'

import type { ThemeDefinition } from '@/themes'
import type { PassedDogCardData } from '@/lib/server/passed-dog-utils'
import { resolveMediaUrl } from '@/components/header/logo-utils'

export function passedDogCardTitle(dog: PassedDogCardData): string {
	return (
		dog.hzd_plugin_dog?.fullKennelName?.trim()
		|| dog.DogName?.trim()
		|| 'Unbekannt'
	)
}

/** Anzeige Sterbedatum (GraphQL `DatePassed`) im deutschsprachigen Kurzformat */
export function formatPassedDogDate(
	raw: string | null | undefined,
): string | null {
	if (raw == null || String(raw).trim() === '') {
		return null
	}
	const s = String(raw).slice(0, 10)
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
	if (m) {
		return `${m[3]}.${m[2]}.${m[1]}`
	}
	const d = new Date(raw)
	if (!Number.isNaN(d.getTime())) {
		return d.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
	}
	return null
}

interface PassedDogCardProps {
	dog: PassedDogCardData
	strapiBaseUrl: string
	theme: ThemeDefinition
	onOpen: (dog: PassedDogCardData) => void
}

export function PassedDogCard({
	dog,
	strapiBaseUrl,
	theme,
	onOpen,
}: PassedDogCardProps) {
	const title = passedDogCardTitle(dog)
	const dateLabel = formatPassedDogDate(dog.DatePassed)
	const avatarUrl = dog.Avatar
		? resolveMediaUrl(dog.Avatar, strapiBaseUrl)
		: null

	return (
		<button
			type="button"
			onClick={() => onOpen(dog)}
			className="group relative w-full overflow-hidden rounded-2xl border border-black/5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
			style={
				{
					['--tw-ring-color' as string]: theme.buttonColor,
				} as React.CSSProperties
			}
		>
			<div className="relative aspect-[4/3] w-full bg-gradient-to-br from-neutral-200 to-neutral-400">
				{avatarUrl ? (
					<img
						src={avatarUrl}
						alt=""
						className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
					/>
				) : null}
				<div
					className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
					aria-hidden
				/>
				<div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
					<div
						className="flex flex-wrap items-end gap-x-2 gap-y-1"
						style={{ textShadow: '0 1px 8px rgba(0,0,0,0.85)' }}
					>
						<p className="line-clamp-3 min-w-0 flex-1 text-sm font-bold leading-snug text-white drop-shadow-md sm:text-base">
							{title}
						</p>
						{dateLabel ? (
							<span
								className="shrink-0 text-xs font-semibold tabular-nums text-white/95 sm:text-sm"
								title="Sterbedatum"
							>
								† {dateLabel}
							</span>
						) : null}
					</div>
				</div>
			</div>
		</button>
	)
}
