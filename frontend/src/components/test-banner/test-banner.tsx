export function TestBanner() {

	const isTestMode = process.env.NEXT_PUBLIC_TEST === 'true'

	if (!isTestMode) {
		return null
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				right: 0,
				zIndex: 9999,
				width: '200px',
				height: '200px',
				overflow: 'hidden',
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: '30px',
					right: '-70px',
					width: '300px',
					height: '40px',
					backgroundColor: '#dc2626',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontWeight: 'bold',
					fontSize: '14px',
					transform: 'rotate(45deg)',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
					textTransform: 'uppercase',
					letterSpacing: '1px',
				}}
			>
				TEST-SYSTEM
			</div>
		</div>
	)
}




