import type { ReactNode } from 'react'

interface SectionContainerProps {
	variant?: 'max-width' | 'full-width'
	id?: string
	backgroundColor?: string
	paddingTop?: string
	paddingBottom?: string
	marginTop?: string
	marginBottom?: string
	children: ReactNode
}

export function SectionContainer({
	variant = 'max-width',
	id,
	backgroundColor,
	paddingTop,
	paddingBottom,
	marginTop,
	marginBottom,
	children,
}: SectionContainerProps) {

	const innerContainerClasses =
		variant === 'max-width' ? 'w-full max-w-5xl' : 'w-full'

	const paddingX = variant === 'max-width' ? '.5rem' : '0'

	return (
		<section
			id={id}
			className="flex w-full justify-center"
			style={{
				paddingTop,
				paddingBottom,
				paddingLeft: paddingX,
				paddingRight: paddingX,
				marginTop,
				marginBottom,
			}}
		>
			<div className={innerContainerClasses}>{children}</div>
		</section>
	)
}








