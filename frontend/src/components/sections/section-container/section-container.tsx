import type { ReactNode } from 'react'

interface SectionContainerProps {
	variant?: 'max-width' | 'full-width'
	backgroundColor?: string
	paddingTop?: string
	paddingBottom?: string
	children: ReactNode
}

export function SectionContainer({
	variant = 'max-width',
	backgroundColor,
	paddingTop,
	paddingBottom,
	children,
}: SectionContainerProps) {
	const containerClasses =
		variant === 'max-width'
			? 'flex w-full justify-center px-4'
			: 'flex w-full justify-center'

	const innerContainerClasses =
		variant === 'max-width' ? 'w-full max-w-5xl' : 'w-full'

	return (
		<section
			className={containerClasses}
			style={{
				backgroundColor,
				paddingTop,
				paddingBottom,
			}}
		>
			<div className={innerContainerClasses}>{children}</div>
		</section>
	)
}



