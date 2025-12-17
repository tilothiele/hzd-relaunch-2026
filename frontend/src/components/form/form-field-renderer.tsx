import {
	Box,
	TextField,
	Typography,
	FormControl,
	FormControlLabel,
	Checkbox,
	Select,
	MenuItem,
	InputLabel,
	Divider,
} from '@mui/material'
import type {
	FormField,
	ShortTextInput,
	EmailAddress,
	TextArea,
	NumberInput,
	Choice,
	BooleanChoice,
	GroupSeparator,
	StaticText,
	StandardIdentifier,
} from '@/types'

export function renderFormField(
	field: FormField,
	index: number,
	values: Record<string, unknown>,
	onChange: (name: string, value: unknown) => void,
) {
	const uniqueKey = `field-${index}`
	switch (field.__typename) {
		case 'ComponentFormShortTextInput': {
			const shortText = field as ShortTextInput
			return (
				<TextField
					key={uniqueKey}
					label={shortText.STName ?? 'Text'}
					name={shortText.STName ?? field.id}
					value={values[shortText.STName ?? field.id ?? ''] ?? ''}
					onChange={(e) => onChange(shortText.STName ?? field.id ?? '', e.target.value)}
					fullWidth
					multiline={shortText.MultiLine ?? false}
					inputProps={{
						minLength: shortText.MinLength ?? undefined,
					}}
					required={shortText.MinLength ? shortText.MinLength > 0 : false}
					size='small'
				/>
			)
		}

		case 'ComponentFormEmailAdress': {
			const email = field as EmailAddress
			return (
				<TextField
					key={uniqueKey}
					label={email.EAName ?? 'E-Mail'}
					name={email.EAName ?? field.id}
					type='email'
					value={values[email.EAName ?? field.id ?? ''] ?? ''}
					onChange={(e) => onChange(email.EAName ?? field.id ?? '', e.target.value)}
					fullWidth
					required={email.EARequired ?? false}
					size='small'
				/>
			)
		}

		case 'ComponentFormTextArea': {
			const textArea = field as TextArea
			return (
				<TextField
					key={uniqueKey}
					label={textArea.TAName ?? 'Textbereich'}
					name={textArea.TAName ?? field.id}
					value={values[textArea.TAName ?? field.id ?? ''] ?? ''}
					onChange={(e) => onChange(textArea.TAName ?? field.id ?? '', e.target.value)}
					fullWidth
					multiline
					rows={4}
					size='small'
				/>
			)
		}

		case 'ComponentFormNumberInput': {
			const number = field as NumberInput
			return (
				<TextField
					key={uniqueKey}
					label={number.NIName ?? 'Zahl'}
					name={number.NIName ?? field.id}
					type='number'
					value={values[number.NIName ?? field.id ?? ''] ?? ''}
					onChange={(e) => onChange(number.NIName ?? field.id ?? '', e.target.value)}
					fullWidth
					inputProps={{
						min: number.NIMinValue ?? undefined,
						max: number.NIMaxValue ?? undefined,
					}}
					required={number.NIRequired ?? false}
					size='small'
				/>
			)
		}

		case 'ComponentFormChoice': {
			const choice = field as Choice
			if (choice.MultipleChoice) {
				// Multi-Select
				return (
					<FormControl key={uniqueKey} fullWidth size='small'>
						<InputLabel>{choice.CName ?? 'Auswahl'}</InputLabel>
						<Select
							multiple
							value={(values[choice.CName ?? field.id ?? ''] as string[]) ?? []}
							onChange={(e) => onChange(choice.CName ?? field.id ?? '', e.target.value)}
							label={choice.CName ?? 'Auswahl'}
							required={choice.CRequired ?? false}
						>
							{choice.Options?.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)
			} else {
				// Single-Select (Dropdown)
				return (
					<FormControl key={uniqueKey} fullWidth size='small' required={choice.CRequired ?? false}>
						<InputLabel>{choice.CName ?? 'Auswahl'}</InputLabel>
						<Select
							value={values[choice.CName ?? field.id ?? ''] ?? ''}
							onChange={(e) => onChange(choice.CName ?? field.id ?? '', e.target.value)}
							label={choice.CName ?? 'Auswahl'}
						>
							{choice.Options?.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)
			}
		}

		case 'ComponentFormBooleanChoice': {
			const booleanChoice = field as BooleanChoice
			return (
				<FormControlLabel
					key={uniqueKey}
					control={
						<Checkbox
							checked={(values[booleanChoice.BCName ?? field.id ?? ''] as boolean) ?? false}
							onChange={(e) => onChange(booleanChoice.BCName ?? field.id ?? '', e.target.checked)}
							name={booleanChoice.BCName ?? field.id}
							required={booleanChoice.BCRequired ?? false}
						/>
					}
					label={booleanChoice.BCName ?? 'Checkbox'}
				/>
			)
		}

		case 'ComponentFormFldGroupSeparator': {
			const separator = field as GroupSeparator
			return (
				<Box key={uniqueKey} sx={{ my: 3 }}>
					{separator.GroupName ? (
						<Typography variant='h6' sx={{ mb: 1 }}>
							{separator.GroupName}
						</Typography>
					) : null}
					<Divider />
				</Box>
			)
		}

		case 'ComponentFormFldStaticText': {
			const staticText = field as StaticText
			return (
				<Box key={uniqueKey} sx={{ mb: 2 }}>
					<Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
						{staticText.StaticContent ?? ''}
					</Typography>
				</Box>
			)
		}

		case 'ComponentFormStandardIdentifiers': {
			const identifier = field as StandardIdentifier

			const inputs = {
				membershipNumber: { label: 'Mitgliedsnummer', required: identifier.MembershipNumber },
				firstName: { label: 'Vorname', required: identifier.FirstName },
				lastName: { label: 'Nachname', required: identifier.LastName },
				street: { label: 'Straße', required: identifier.Street },
				zip: { label: 'PLZ', required: identifier.Zip },
				city: { label: 'Ort', required: identifier.City },
				countryCode: { label: 'Ländercode', required: identifier.CountryCode },
				phone: { label: 'Telefon', required: identifier.Phone },
				email: { label: 'E-Mail', required: identifier.EMail },
			} as const

			const renderInput = (key: keyof typeof inputs) => {
				const config = inputs[key]
				const status = config.required
				if (!status || status === 'Nein') {
					return null
				}
				const isRequired = status === 'Erforderlich'
				return (
					<TextField
						key={`${uniqueKey}-${key}`}
						label={`${config.label}`}
						name={key}
						value={values[key] ?? ''}
						onChange={(e) => onChange(key, e.target.value)}
						fullWidth
						required={isRequired}
						size='small'
						sx={{ flex: 1, minWidth: 0 }}
					/>
				)
			}

			return (
				<Box key={uniqueKey} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{/* Mitgliedsnummer, Vorname, Nachname */}
					{(inputs.membershipNumber.required || inputs.firstName.required || inputs.lastName.required) ? (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
							{renderInput('membershipNumber')}
							{renderInput('firstName')}
							{renderInput('lastName')}
						</Box>
					) : null}

					{/* Straße (eigene Zeile) */}
					{inputs.street.required ? (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
							{renderInput('street')}
						</Box>
					) : null}

					{/* PLZ, Ort, Ländercode */}
					{(inputs.zip.required || inputs.city.required || inputs.countryCode.required) ? (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
							{renderInput('countryCode')}
							{renderInput('zip')}
							{renderInput('city')}
						</Box>
					) : null}

					{/* Telefon, E-Mail */}
					{(inputs.phone.required || inputs.email.required) ? (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
							{renderInput('phone')}
							{renderInput('email')}
						</Box>
					) : null}
				</Box>
			)
		}

		case 'ComponentFormFormSubmitButton': {
			// Submit Button wird separat gerendert
			return null
		}

		default:
			return null
	}
}

