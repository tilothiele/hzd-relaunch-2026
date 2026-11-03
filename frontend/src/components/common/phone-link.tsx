'use client'

import { Fragment, type CSSProperties, type MouseEvent } from 'react'
import { splitPhoneSegments, toInternationalTel } from '@/lib/phone'

interface PhoneLinkProps {
	phone: string
	countryCode?: string | null
	className?: string
	style?: CSSProperties
}

function stopParentClick(event: MouseEvent<HTMLAnchorElement>) {
	event.stopPropagation()
}

export function PhoneLink({
	phone,
	countryCode,
	className = 'underline',
	style,
}: PhoneLinkProps) {
	const segments = splitPhoneSegments(phone)

	if (segments.length === 0) {
		return null
	}

	return (
		<>
			{segments.map((segment, index) => {
				const href = toInternationalTel(segment.number, countryCode)

				return (
					<Fragment key={`${segment.text}-${index}`}>
						{segment.separator}
						{segment.label}
						{href ? (
							<a
								href={href}
								className={className}
								style={{ textDecoration: 'underline', ...style }}
								onClick={stopParentClick}
							>
								{segment.number}
							</a>
						) : (
							segment.number
						)}
					</Fragment>
				)
			})}
		</>
	)
}
