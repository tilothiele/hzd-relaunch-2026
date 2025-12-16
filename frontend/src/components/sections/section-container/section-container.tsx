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

	const innerContainerClasses =
		variant === 'max-width' ? 'w-full max-w-5xl' : 'w-full'

	const paddingX = variant === 'max-width' ? '.5rem' : '0'

	return (
		<section
			className="flex w-full justify-center"
			style={{
				paddingTop,
				paddingBottom,
				paddingLeft: paddingX,
				paddingRight: paddingX
			}}
		>
			<div className={innerContainerClasses}>{children}</div>
		</section>
	)
}






