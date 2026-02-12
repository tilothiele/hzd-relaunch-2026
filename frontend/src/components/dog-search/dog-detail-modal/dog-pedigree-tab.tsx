import type { Dog } from '@/types'
import { formatDate } from '@/lib/date-utils'

interface DogPedigreeTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPedigreeTab({ dog }: DogPedigreeTabProps) {
	// Function usage replaced by imported utility

	const renderDogCard = (dog: Dog | null | undefined, relation: string) => {
		if (!dog) {
			return (
				<div className='flex h-full w-full flex-col justify-center rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-400'>
					<span className='font-semibold'>{relation}</span>
					<span>Keine Daten verfügbar</span>
				</div>
			)
		}

		return (
			<div className='flex h-full w-full flex-col justify-center rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-sm'>
				<div className='mb-1 font-bold text-gray-900'>
					{dog.fullKennelName || dog.givenName}
				</div>
				{/* <div className='text-gray-600'>
					{dog.owner ? (
						<span>
							Besitzer: {dog.owner.firstName} {dog.owner.lastName}
						</span>
					) : null}
				</div> */}
				<div className='text-gray-600'>
					{dog.dateOfBirth ? (
						<span>* {formatDate(dog.dateOfBirth)}</span>
					) : null}
					{dog.dateOfDeath ? (
						<span> † {formatDate(dog.dateOfDeath)}</span>
					) : null}
				</div>
			</div>
		)
	}

	return (
		<div className='w-full p-4'>
			<div className='flex flex-col items-center gap-8'>
				{/* Generation 1: Parents */}
				<div className='flex flex-col gap-12 items-center'>

					{/* Father's Line */}
					<div className='flex flex-row items-center gap-4'>
						<div className='w-48'>
							<div className='mb-2 font-semibold text-gray-500'>Vater</div>
							{renderDogCard(dog.father, 'Vater')}
						</div>

						{/* Father's Parents (Grandparents) */}
						<div className='flex flex-col gap-4'>
							<div className='flex flex-row items-center gap-4'>
								<div className='w-48'>
									{renderDogCard(dog.father?.father, 'Großvater (V)')}
								</div>
								{/* Father's Father's Parents (Great-Grandparents) */}
								<div className='flex flex-col gap-2'>
									<div className='w-48'>
										{renderDogCard(dog.father?.father?.father, 'Urgroßvater')}
									</div>
									<div className='w-48'>
										{renderDogCard(dog.father?.father?.mother, 'Urgroßmutter')}
									</div>
								</div>
							</div>

							<div className='flex flex-row items-center gap-4'>
								<div className='w-48'>
									{renderDogCard(dog.father?.mother, 'Großmutter (V)')}
								</div>
								{/* Father's Mother's Parents (Great-Grandparents) */}
								<div className='flex flex-col gap-2'>
									<div className='w-48'>
										{renderDogCard(dog.father?.mother?.father, 'Urgroßvater')}
									</div>
									<div className='w-48'>
										{renderDogCard(dog.father?.mother?.mother, 'Urgroßmutter')}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Mother's Line */}
					<div className='flex flex-row items-center gap-4'>
						<div className='w-48'>
							<div className='mb-2 font-semibold text-gray-500'>Mutter</div>
							{renderDogCard(dog.mother, 'Mutter')}
						</div>

						{/* Mother's Parents (Grandparents) */}
						<div className='flex flex-col gap-4'>
							<div className='flex flex-row items-center gap-4'>
								<div className='w-48'>
									{renderDogCard(dog.mother?.father, 'Großvater (M)')}
								</div>
								{/* Mother's Father's Parents (Great-Grandparents) */}
								<div className='flex flex-col gap-2'>
									<div className='w-48'>
										{renderDogCard(dog.mother?.father?.father, 'Urgroßvater')}
									</div>
									<div className='w-48'>
										{renderDogCard(dog.mother?.father?.mother, 'Urgroßmutter')}
									</div>
								</div>
							</div>

							<div className='flex flex-row items-center gap-4'>
								<div className='w-48'>
									{renderDogCard(dog.mother?.mother, 'Großmutter (M)')}
								</div>
								{/* Mother's Mother's Parents (Great-Grandparents) */}
								<div className='flex flex-col gap-2'>
									<div className='w-48'>
										{renderDogCard(dog.mother?.mother?.father, 'Urgroßvater')}
									</div>
									<div className='w-48'>
										{renderDogCard(dog.mother?.mother?.mother, 'Urgroßmutter')}
									</div>
								</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	)
}
