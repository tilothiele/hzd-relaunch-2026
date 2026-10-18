'use client'

import { useState } from 'react'
import {
	BesonderheitInput,
	Card,
	CheckRow,
	CheckboxGroup,
	Field,
	FieldRow,
	PdfAnleitung,
	RadioGroup,
	SignatureGrid,
} from './FormControls'
import {
	createWelpenRow,
	createWelpenkaeufer,
	MAX_WELPEN_ROWS,
	MIN_WELPEN_ROWS,
	WELPEN_FARBE_OPTIONS,
	WELPEN_GESCHLECHT_OPTIONS,
	WURF_NR_OPTIONS,
	type StammblattData,
	type WelpenFarbe,
	type WelpenGeschlecht,
	type WelpenkaeuferData,
	type WelpenRowData,
	type WurfabnahmeFormData,
} from '@/types/wurfabnahme-form'

interface SignatureProps {
	signatures: Record<string, string>
	onSignatureChange: (id: string, dataUrl: string) => void
	readOnly?: boolean
}

interface StammblattPageProps extends SignatureProps {
	data: StammblattData
	formData: WurfabnahmeFormData
	welpen: WelpenRowData[]
	onWelpenChange: (welpen: WelpenRowData[]) => void
	onWelpenkaeuferChange: (rows: WelpenkaeuferData[]) => void
	onChange: (data: StammblattData) => void
	deletedIds?: Set<string>
	onMarkDelete?: (id: string) => void
	onUndoDelete?: (id: string) => void
	onOpenHundinSearch?: () => void
	onOpenZuechterSearch?: () => void
}

function WelpenTable({
	rows,
	onMarkDelete,
	onUndoDelete,
	deletedIds,
	onUpdate,
}: {
	rows: WelpenRowData[]
	onMarkDelete: (id: string) => void
	onUndoDelete: (id: string) => void
	deletedIds: Set<string>
	onUpdate: (
		index: number,
		field: keyof WelpenRowData,
		value: string,
	) => void
}) {
	return (
		<div style={{ overflowX: 'auto' }}>
			<table className="wa-welpen-table">
				<thead>
					<tr>
						<th style={{ width: 36 }}>#</th>
						<th>Zuchtbuch-Nr. / Register-Nr.</th>
						<th style={{ width: 70 }}>R/H</th>
						<th>Name Welpe</th>
						<th style={{ width: 70 }}>Farbe</th>
						<th>Chipnummer</th>
						<th>Gechippt am</th>
						<th>Verstorben am</th>
						<th
							className="wa-col-actions"
							style={{ width: 40, textAlign: 'center' }}
							aria-label="Aktionen"
						/>
					</tr>
				</thead>
<tbody>
				{rows.map((row, idx) => {
					const isDeleted = deletedIds.has(row.id)
					return (
						<tr
							key={row.id}
							className={isDeleted ? 'opacity-40' : ''}
						>
							<td style={{ textAlign: 'center', fontWeight: 600 }}>
								{isDeleted ? (
									<span className="text-red-400 line-through" title="Zum Löschen vorgemerkt">
										–
									</span>
								) : (
									idx + 1
								)}
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<input
									type="text"
									placeholder="Nr."
									style={{ width: 100 }}
									value={row.zuchtbuchNr}
									onChange={(e) =>
										onUpdate(rows.indexOf(row), 'zuchtbuchNr', e.target.value)
									}
									disabled={isDeleted}
									className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}
								/>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<select
									className={`wa-select-compact${isDeleted ? ' bg-red-100 dark:bg-red-900/30' : ''}`}
									value={row.geschlecht}
									onChange={(e) =>
										onUpdate(
											rows.indexOf(row),
											'geschlecht',
											e.target.value as WelpenGeschlecht,
										)
									}
									disabled={isDeleted}
								>
									<option value="">–</option>
									{WELPEN_GESCHLECHT_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<input
									type="text"
									placeholder="Name"
									value={row.name}
									onChange={(e) => onUpdate(rows.indexOf(row), 'name', e.target.value)}
									disabled={isDeleted}
									className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}
								/>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<select
									className={`wa-select-compact${isDeleted ? ' bg-red-100 dark:bg-red-900/30' : ''}`}
									value={row.farbe}
									onChange={(e) =>
										onUpdate(rows.indexOf(row), 'farbe', e.target.value as WelpenFarbe)
									}
									disabled={isDeleted}
								>
									<option value="">–</option>
									{WELPEN_FARBE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<input
									type="text"
									placeholder="Chip-Nr."
									value={row.chipNr}
									onChange={(e) => onUpdate(rows.indexOf(row), 'chipNr', e.target.value)}
									disabled={isDeleted}
									className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}
								/>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<input
									type="date"
									value={row.gechiptAm}
									onChange={(e) => onUpdate(rows.indexOf(row), 'gechiptAm', e.target.value)}
									disabled={isDeleted}
									className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}
								/>
							</td>
							<td className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}>
								<input
									type="date"
									value={row.verstorbenAm}
									onChange={(e) =>
										onUpdate(rows.indexOf(row), 'verstorbenAm', e.target.value)
									}
									disabled={isDeleted}
									className={isDeleted ? 'bg-red-100 dark:bg-red-900/30' : ''}
								/>
							</td>
							<td className="wa-col-actions" style={{ textAlign: 'center' }}>
								{isDeleted ? (
									<button
										type="button"
										className="wa-btn-icon"
										onClick={() => onUndoDelete(row.id)}
										title="Löschen rückgängig"
										aria-label="Löschen rückgängig"
									>
										↩
									</button>
								) : (
									<button
										type="button"
										className="wa-btn-icon"
										onClick={() => onMarkDelete(row.id)}
										title="Welpe zum Löschen vormerken"
										aria-label="Welpe zum Löschen vormerken"
									>
										×
									</button>
								)}
							</td>
						</tr>
					)
				})}
			</tbody>
			</table>
		</div>
	)
}

function puppyChoices(
	welpen: WelpenRowData[],
	deletedIds: Set<string>,
) {
	return welpen.flatMap((welpe, index) => {
		if (welpe.deletedAt || deletedIds.has(welpe.id)) {
			return []
		}

		return [{
			id: welpe.id,
			nummer: index + 1,
			name: welpe.name.trim() || 'ohne Name',
		}]
	})
}

function WelpenkaeuferSection({
	rows,
	welpen,
	deletedIds,
	readOnly,
	onChange,
}: {
	rows: WelpenkaeuferData[]
	welpen: WelpenRowData[]
	deletedIds: Set<string>
	readOnly?: boolean
	onChange: (rows: WelpenkaeuferData[]) => void
}) {
	const [openIds, setOpenIds] = useState<string[]>([])
	const choices = puppyChoices(welpen, deletedIds)

	const toggleOpen = (id: string) => {
		setOpenIds((current) => (
			current.includes(id)
				? current.filter((entry) => entry !== id)
				: [...current, id]
		))
	}

	const updateRow = (
		id: string,
		patch: Partial<WelpenkaeuferData>,
	) => {
		onChange(rows.map((row) => (
			row.id === id ? { ...row, ...patch } : row
		)))
	}

	const toggleWelpe = (row: WelpenkaeuferData, welpeId: string) => {
		const selected = row.welpenIds.includes(welpeId)
		updateRow(row.id, {
			welpenIds: selected
				? row.welpenIds.filter((entry) => entry !== welpeId)
				: [...row.welpenIds, welpeId],
		})
	}

	const addRow = () => {
		const row = createWelpenkaeufer()
		onChange([...rows, row])
		setOpenIds((current) => [...current, row.id])
	}

	const removeRow = (id: string) => {
		onChange(rows.filter((row) => row.id !== id))
		setOpenIds((current) => current.filter((entry) => entry !== id))
	}

	return (
		<Card title="Welpenkäufer">
			<div className="wa-welpen-actions">
				<p className="wa-welpen-count">
					Anzahl Welpenkäufer: <strong>{rows.length}</strong>
				</p>
				<div className="wa-btn-row-action">
					<button
						type="button"
						className="wa-btn-secondary wa-btn-add-row"
						onClick={addRow}
						disabled={readOnly}
					>
						+ Welpenkäufer
					</button>
				</div>
			</div>
			{rows.length === 0 ? (
				<p className="wa-kaeufer-empty">Keine Welpenkäufer erfasst.</p>
			) : null}
			{rows.map((row) => {
				const isOpen = openIds.includes(row.id)
				const selected = choices
					.filter((choice) => row.welpenIds.includes(choice.id))
					.map((choice) => `${choice.nummer} ${choice.name}`)
					.join(', ')

				return (
					<div key={row.id} className="wa-kaeufer-row">
						<div className="wa-kaeufer-summary">
							<span
								role="button"
								tabIndex={0}
								className="wa-kaeufer-toggle"
								aria-expanded={isOpen}
								onClick={() => toggleOpen(row.id)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault()
										toggleOpen(row.id)
									}
								}}
							>
								<span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
								<span className={row.vorname ? '' : 'wa-kaeufer-placeholder'}>
									{row.vorname || 'Vorname'}
								</span>
								<span className={row.name ? '' : 'wa-kaeufer-placeholder'}>
									{row.name || 'Name'}
								</span>
								<span className={row.ort ? '' : 'wa-kaeufer-placeholder'}>
									{row.ort || 'Ort'}
								</span>
								<span className={selected ? '' : 'wa-kaeufer-placeholder'}>
									{selected || 'keine Welpen'}
								</span>
							</span>
							<button
								type="button"
								className="wa-btn-icon"
								onClick={() => removeRow(row.id)}
								disabled={readOnly}
								title="Welpenkäufer entfernen"
								aria-label="Welpenkäufer entfernen"
							>
								×
							</button>
						</div>
						{isOpen ? (
							<div className="wa-kaeufer-body">
								<FieldRow cols={2}>
									<Field label="Vorname">
										<input
											type="text"
											value={row.vorname}
											onChange={(event) => updateRow(row.id, {
												vorname: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
									<Field label="Name">
										<input
											type="text"
											value={row.name}
											onChange={(event) => updateRow(row.id, {
												name: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
								</FieldRow>
								<FieldRow cols={2}>
									<Field label="Geburtsdatum">
										<input
											type="date"
											value={row.geburtsdatum}
											onChange={(event) => updateRow(row.id, {
												geburtsdatum: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
									<Field label="Telefon">
										<input
											type="text"
											value={row.telefon}
											onChange={(event) => updateRow(row.id, {
												telefon: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
								</FieldRow>
								<FieldRow>
									<Field label="Straße und Hausnummer">
										<input
											type="text"
											value={row.strasse}
											onChange={(event) => updateRow(row.id, {
												strasse: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
								</FieldRow>
								<FieldRow cols={3}>
									<Field label="Land">
										<input
											type="text"
											value={row.land}
											onChange={(event) => updateRow(row.id, {
												land: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
									<Field label="PLZ">
										<input
											type="text"
											value={row.plz}
											onChange={(event) => updateRow(row.id, {
												plz: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
									<Field label="Ort">
										<input
											type="text"
											value={row.ort}
											onChange={(event) => updateRow(row.id, {
												ort: event.target.value,
											})}
											disabled={readOnly}
										/>
									</Field>
								</FieldRow>
								<div className="wa-field">
									<label>Welpen</label>
									<div className="wa-check-group">
										{choices.length === 0 ? (
											<span className="wa-kaeufer-placeholder">
												Noch keine Welpen erfasst.
											</span>
										) : choices.map((choice) => (
											<label key={choice.id} className="wa-cb-item">
												<input
													type="checkbox"
													checked={row.welpenIds.includes(choice.id)}
													onChange={() => toggleWelpe(row, choice.id)}
													disabled={readOnly}
												/>
												<span className="wa-cb-box" />
												<span>{choice.nummer} {choice.name}</span>
											</label>
										))}
									</div>
								</div>
							</div>
						) : null}
					</div>
				)
			})}
		</Card>
	)
}

export function StammblattPage({
	data,
	formData,
	welpen,
	onWelpenChange,
	onWelpenkaeuferChange,
	onChange,
	signatures,
	onSignatureChange,
	readOnly,
	deletedIds = new Set(),
	onMarkDelete,
	onUndoDelete,
	onOpenHundinSearch,
	onOpenZuechterSearch,
}: StammblattPageProps) {
	const updateField = <K extends keyof StammblattData>(
		field: K,
		value: StammblattData[K],
	) => {
		onChange({ ...data, [field]: value })
	}

	const handleAddRow = () => {
		if (welpen.length >= MAX_WELPEN_ROWS) return
		onWelpenChange([...welpen, createWelpenRow()])
	}

	const handleRemoveRow = (index: number) => {
		if (welpen.length <= MIN_WELPEN_ROWS) return
		onWelpenChange(welpen.filter((_, i) => i !== index))
	}

	const handleWelpeUpdate = (
		index: number,
		field: keyof WelpenRowData,
		value: string,
	) => {
		onWelpenChange(
			welpen.map((row, i) =>
				i === index ? { ...row, [field]: value } : row,
			),
		)
	}

	return (
		<div className="wa-page active" id="page-stammblatt">
			<div className="wa-page-title">Wurfabnahmeprotokoll</div>
			<div className="wa-page-subtitle">
				Stammblatt · Hovawart Zuchtgemeinschaft Deutschland e.V.
			</div>

			<Card title="Züchter">
				<FieldRow cols={2}>
					<Field label="Name">
						<div className="flex gap-2">
							<input
								type="text"
								value={data.zuechterName}
								onChange={(e) => updateField('zuechterName', e.target.value)}
								className="flex-1"
							/>
							{onOpenZuechterSearch && (
								<button
									type="button"
									onClick={onOpenZuechterSearch}
									title="Aus Datenbank übernehmen"
									className="flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
								>
									🔍
								</button>
							)}
						</div>
					</Field>
					<Field label="Datum">
						<input
							type="date"
							value={data.datum}
							onChange={(e) => updateField('datum', e.target.value)}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Zwingername">
						<input
							type="text"
							value={data.zwingername}
							onChange={(e) => updateField('zwingername', e.target.value)}
						/>
					</Field>
					<Field label="Wurf im Zwinger (Nr.)">
						<select
							value={data.wurfNr}
							onChange={(e) => updateField('wurfNr', e.target.value)}
						>
							<option value="">–</option>
							{WURF_NR_OPTIONS.map((letter) => (
								<option key={letter} value={letter}>
									{letter}
								</option>
							))}
						</select>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Straße / Nr.">
						<input
							type="text"
							value={data.strasse}
							onChange={(e) => updateField('strasse', e.target.value)}
						/>
					</Field>
					<Field label="PLZ / Ort">
						<input
							type="text"
							value={data.plzOrt}
							onChange={(e) => updateField('plzOrt', e.target.value)}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Telefon">
						<input
							type="text"
							value={data.telefon}
							onChange={(e) => updateField('telefon', e.target.value)}
						/>
					</Field>
					<Field label="E-Mail">
						<input
							type="email"
							value={data.email}
							onChange={(e) => updateField('email', e.target.value)}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Wurfinformationen">
				<FieldRow cols={2}>
					<Field label="Zuchthündin">
						<div className="flex gap-2">
							<input
								type="text"
								value={data.zuchthuendin}
								onChange={(e) =>
									updateField('zuchthuendin', e.target.value)
								}
								className="flex-1"
							/>
							{onOpenHundinSearch && (
								<button
									type="button"
									onClick={onOpenHundinSearch}
									title="Aus Datenbank übernehmen"
									className="flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
								>
									🔍
								</button>
							)}
						</div>
					</Field>
					<Field label="Zuchtbuch-Nr.">
						<input
							type="text"
							value={data.zuchtbuchNrHuendin}
							onChange={(e) =>
								updateField('zuchtbuchNrHuendin', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Wurf gefallen am">
						<input
							type="date"
							value={data.wurfGefallenAm}
							onChange={(e) =>
								updateField('wurfGefallenAm', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Welpen – Übersicht">
				<div className="wa-welpen-actions">
					<p className="wa-welpen-count">
						Anzahl Welpen: <strong>{welpen.length}</strong>
					</p>
					<div className="wa-btn-row-action">
						<button
							type="button"
							className="wa-btn-secondary wa-btn-add-row"
							onClick={handleAddRow}
							disabled={welpen.length >= MAX_WELPEN_ROWS}
						>
							+ Zeile hinzufügen
						</button>
					</div>
				</div>
				<WelpenTable
					rows={welpen}
					deletedIds={deletedIds}
					onMarkDelete={onMarkDelete ?? (() => {})}
					onUndoDelete={onUndoDelete ?? (() => {})}
					onUpdate={handleWelpeUpdate}
				/>
			</Card>

			<WelpenkaeuferSection
				rows={formData.welpenkaeufer ?? []}
				welpen={welpen}
				deletedIds={deletedIds}
				readOnly={readOnly}
				onChange={onWelpenkaeuferChange}
			/>

			<Card title="Beurteilung">
				<FieldRow>
					<Field label="Gesamteindruck">
						<textarea
							value={data.gesamteindruck}
							onChange={(e) =>
								updateField('gesamteindruck', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Pflegezustand / Aufzuchtbedingungen">
						<textarea
							value={data.pflegezustand}
							onChange={(e) =>
								updateField('pflegezustand', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Zustand der Hündin">
						<textarea
							value={data.zustandHundin}
							onChange={(e) =>
								updateField('zustandHundin', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Unterschriften">
				<SignatureGrid
					signatures={[
						{ id: 'sig-zw-stamm', label: 'Zuchtwart' },
						{ id: 'sig-zue-stamm', label: 'Züchter' },
						{ id: 'sig-zwa-stamm', label: 'Zuchtwartanwärter' },
					]}
					values={signatures}
					onChange={onSignatureChange}
					readOnly={readOnly}
				/>
				<FieldRow cols={3} style={{ marginTop: 16 }}>
					<Field label="Zuchtwart">
						<input
							type="text"
							value={data.zuchtwartName}
							onChange={(e) =>
								updateField('zuchtwartName', e.target.value)
							}
						/>
					</Field>
					<Field label="Züchtername">
						<input
							type="text"
							value={data.zuechterUnterschriftName}
							onChange={(e) =>
								updateField('zuechterUnterschriftName', e.target.value)
							}
						/>
					</Field>
					<Field label="Zuchtanwärtername">
						<input
							type="text"
							value={data.zuchtanwaerterName}
							onChange={(e) =>
								updateField('zuchtanwaerterName', e.target.value)
							}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2} style={{ marginTop: 16 }}>
					<Field label="Ort">
						<input
							type="text"
							value={data.ortStamm}
							onChange={(e) => updateField('ortStamm', e.target.value)}
						/>
					</Field>
					<Field label="Datum">
						<input
							type="date"
							value={data.datumStamm}
							onChange={(e) => updateField('datumStamm', e.target.value)}
						/>
					</Field>
				</FieldRow>
			</Card>

			<PdfAnleitung formData={formData} deletedIds={deletedIds} />
		</div>
	)
}

interface WelpePageProps extends SignatureProps {
	formData: WurfabnahmeFormData
	deletedIds?: Set<string>
	welpe: WelpenRowData | null
	onChange?: (data: WelpenRowData) => void
}

function updateWelpeField<K extends keyof WelpenRowData>(
	welpe: WelpenRowData,
	field: K,
	value: WelpenRowData[K],
): WelpenRowData {
	return { ...welpe, [field]: value }
}

export function WelpePage({
	welpe,
	onChange,
	signatures,
	onSignatureChange,
	readOnly,
	formData,
	deletedIds,
}: WelpePageProps) {
	if (!welpe || !onChange) {
		return (
			<div className="wa-page active">
				<p className="text-sm text-gray-500 p-4">Kein Welpe ausgewählt.</p>
			</div>
		)
	}

	const set = <K extends keyof WelpenRowData>(field: K, value: WelpenRowData[K]) => {
		if (readOnly) return
		onChange(updateWelpeField(welpe, field, value))
	}

	return (
		<div className="wa-page active" id="page-welpe1">
			<div className="wa-badge">Welpe</div>
			<div className="wa-page-title">Wurfabnahmeprotokoll</div>
			<div className="wa-page-subtitle">Einzelblatt Welpe</div>

			<Card title="Grunddaten">
				<FieldRow cols={2}>
					<Field label="Zuchtbuch-Nr. VDH-HZD">
						<input
							type="text"
							value={welpe.zuchtbuchNr}
							onChange={(e) => set('zuchtbuchNr', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Wurftag">
						<input
							type="date"
							value={welpe.wurftag}
							onChange={(e) => set('wurftag', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={3}>
					<Field label="Gewicht Geburt (g)">
						<input
							type="number"
							value={welpe.gewichtGeburt}
							onChange={(e) => set('gewichtGeburt', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<div
						className="wa-field"
						style={{
							justifyContent: 'flex-end',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 16,
							paddingTop: 20,
						}}
					>
						<label className="wa-rb-item">
							<input
								type="radio"
								name="rh"
								value="R"
								checked={welpe.rh === 'R'}
								onChange={() => set('rh', 'R')}
								disabled={readOnly}
							/>
							<span className="wa-rb-dot" />
							<span>Rüde</span>
						</label>
						<label className="wa-rb-item">
							<input
								type="radio"
								name="rh"
								value="H"
								checked={welpe.rh === 'H'}
								onChange={() => set('rh', 'H')}
								disabled={readOnly}
							/>
							<span className="wa-rb-dot" />
							<span>Hündin</span>
						</label>
					</div>
				</FieldRow>
				<FieldRow cols={3}>
					<Field label="Entwurmt mit">
						<input
							type="text"
							value={welpe.entwurmt}
							onChange={(e) => set('entwurmt', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Zuletzt am">
						<input
							type="date"
							value={welpe.entwurmtAm}
							onChange={(e) => set('entwurmtAm', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Anzahl Wurmkuren">
						<input
							type="number"
							min={0}
							value={welpe.wurmkuren}
							onChange={(e) => set('wurmkuren', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Wurfbesichtigung am">
						<input
							type="date"
							value={welpe.wurfbesichtigung}
							onChange={(e) => set('wurfbesichtigung', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Feststellungen bei der Wurfabnahme">
				<FieldRow cols={3}>
					<Field label="Chip Nr.">
						<input
							type="text"
							value={welpe.chipNr}
							onChange={(e) => set('chipNr', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Gechippt am">
						<input
							type="date"
							value={welpe.gechiptAm}
							onChange={(e) => set('gechiptAm', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Gewicht Wurfabnahme (g)">
						<input
							type="number"
							value={welpe.gewichtWa}
							onChange={(e) => set('gewichtWa', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Geimpft am">
						<input
							type="date"
							value={welpe.geimpft}
							onChange={(e) => set('geimpft', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<div
						className="wa-field"
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							paddingTop: 20,
						}}
					>
						<label className="wa-cb-item">
							<input
								type="checkbox"
								checked={welpe.impfungenIo}
								onChange={(e) => set('impfungenIo', e.target.checked)}
								disabled={readOnly}
							/>
							<span className="wa-cb-box" />
							<span>Impfungen lt. Heimtierausweis i.O.</span>
						</label>
					</div>
				</FieldRow>
			</Card>

			<Card title="Exterieur">
				<CheckRow label="Körperbau">
					<RadioGroup
						name="koerperbau"
						options={['kräftig', 'mittelkräftig', 'leicht']}
						value={welpe.koerperbau}
						onChange={(n, v) => set('koerperbau' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Kopfform">
					<RadioGroup
						name="kopfform"
						options={['kräftig', 'mittel', 'zart']}
						value={welpe.kopfform}
						onChange={(n, v) => set('kopfform' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Stopp">
					<RadioGroup
						name="stopp"
						options={['mittel', 'stark', 'wenig']}
						value={welpe.stopp}
						onChange={(n, v) => set('stopp' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Ohren">
					<RadioGroup
						name="ohren"
						options={['groß', 'mittel', 'klein']}
						value={welpe.ohren}
						onChange={(n, v) => set('ohren' as keyof WelpenRowData, v as any)}
					/>
					<BesonderheitInput
						value={welpe.ohrenBes}
						onChange={(n, v) => set('ohrenBes' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Augen">
					<RadioGroup
						name="augen"
						options={['dunkel', 'mittel', 'hell']}
						value={welpe.augen}
						onChange={(n, v) => set('augen' as keyof WelpenRowData, v as any)}
					/>
					<BesonderheitInput
						value={welpe.augenBes}
						onChange={(n, v) => set('augenBes' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Gebiss">
					<RadioGroup
						name="gebiss"
						options={['Schere', 'Vorbiss', 'Rückbiss', 'Zange']}
						value={welpe.gebiss}
						onChange={(n, v) => set('gebiss' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Stellung Canini">
					<RadioGroup
						name="canini"
						options={['korrekt']}
						value={welpe.canini}
						onChange={(n, v) => set('canini' as keyof WelpenRowData, v as any)}
					/>
					<BesonderheitInput
						value={welpe.caniniBes}
						onChange={(n, v) => set('caniniBes' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Rute">
					<RadioGroup
						name="rute"
						options={['korrekt', 'Rutenveränderung']}
						value={welpe.rute}
						onChange={(n, v) => set('rute' as keyof WelpenRowData, v as any)}
					/>
					<RadioGroup
						name="rutePos"
						options={['Ansatz', 'Mitte', 'Spitze']}
						value={welpe.rutePos}
						onChange={(n, v) => set('rutePos' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Nabel">
					<RadioGroup
						name="nabel"
						options={['korrekt']}
						value={welpe.nabel}
						onChange={(n, v) => set('nabel' as keyof WelpenRowData, v as any)}
					/>
					<BesonderheitInput
						value={welpe.nabelBes}
						onChange={(n, v) => set('nabelBes' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
				<CheckRow label="Hoden">
					<RadioGroup
						name="hoden"
						options={['beide tastbar', 'einer tastbar', 'keiner tastbar']}
						value={welpe.hoden}
						onChange={(n, v) => set('hoden' as keyof WelpenRowData, v as any)}
					/>
				</CheckRow>
			</Card>

			<Card title="Farbbeschreibung">
				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Schwarz mit Marken</div>
					<div className="wa-farbe-body">
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Deckhaar</div>
							<RadioGroup
								name="swDeckhaar"
								options={[
									'tiefschwarz',
									'schwarz',
									'bräunlich',
									'gräulich',
									'rötlich',
								]}
								value={welpe.swDeckhaar}
								onChange={(n, v) => set('swDeckhaar' as keyof WelpenRowData, v as any)}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Markenfarbe</div>
							<RadioGroup
								name="markenfarbe"
								options={[
									'mittelblond',
									'dunkelblond',
									'hellblond/weißlich',
									'grau',
								]}
								value={welpe.markenfarbe}
								onChange={(n, v) => set('markenfarbe' as keyof WelpenRowData, v as any)}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Markenzeichnung</div>
							<RadioGroup
								name="markenzeichnung"
								options={[
									'komplett',
									'knapp',
									'überzeichnet',
									'teilweise fehlend',
								]}
								value={welpe.markenzeichnung}
								onChange={(n, v) => set('markenzeichnung' as keyof WelpenRowData, v as any)}
							/>
						</div>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Blond</div>
					<div className="wa-farbe-body">
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Deckhaar</div>
							<RadioGroup
								name="blDeckhaar"
								options={['mittelblond', 'dunkelblond', 'hellblond']}
								value={welpe.blDeckhaar}
								onChange={(n, v) => set('blDeckhaar' as keyof WelpenRowData, v as any)}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Aufhellungen</div>
							<RadioGroup
								name="aufhellungen"
								options={['vorhanden', 'wenig', 'keine']}
								value={welpe.aufhellungen}
								onChange={(n, v) => set('aufhellungen' as keyof WelpenRowData, v as any)}
							/>
						</div>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Schwarz (einfarbig)</div>
					<div className="wa-farbe-body">
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Deckhaar</div>
							<RadioGroup
								name="sw2Deckhaar"
								options={[
									'tiefschwarz',
									'schwarz',
									'bräunlich',
									'gräulich',
									'rötlich',
								]}
								value={welpe.sw2Deckhaar}
								onChange={(n, v) => set('sw2Deckhaar' as keyof WelpenRowData, v as any)}
							/>
						</div>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Weiße Abzeichen</div>
					<div className="wa-farbe-body">
						<CheckboxGroup
							name="weiss"
							options={[
								'Nasenrücken',
								'Oberkopf',
								'Hals/Kehle',
								'Brust',
								'Bauch',
								'Rutenspitze',
								'Pfoten',
								'Zehenspitzen',
							]}
							values={welpe.weiss}
							onChange={(name, option, checked) => {
								if (checked) {
									set('weiss' as keyof WelpenRowData, [...welpe.weiss, option] as any)
								} else {
									set('weiss' as keyof WelpenRowData, welpe.weiss.filter((w) => w !== option) as any)
								}
							}}
						/>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Pigment</div>
					<div className="wa-farbe-body">
						<RadioGroup
							name="pigment"
							options={['durchgefärbt', 'mittel', 'schwach']}
							value={welpe.pigment}
							onChange={(n, v) => set('pigment' as keyof WelpenRowData, v as any)}
						/>
					</div>
				</div>
			</Card>

			<Card title="Verhalten">
				<CheckboxGroup
					name="verhalten"
					options={[
						'unerschrocken',
						'kontaktfreudig',
						'temperamentvoll',
						'unbeeindruckt',
						'sicher',
						'beeindruckt',
						'gleichgültig',
						'zurückhaltend',
						'teilnahmslos',
						'apathisch',
						'ängstlich',
					]}
					values={welpe.verhalten}
					onChange={(name, option, checked) => {
						if (checked) {
							set('verhalten' as keyof WelpenRowData, [...welpe.verhalten, option] as any)
						} else {
							set('verhalten' as keyof WelpenRowData, welpe.verhalten.filter((v) => v !== option) as any)
						}
					}}
				/>
			</Card>

			<Card title="Bemerkungen">
				<FieldRow>
					<Field label="Abweichungen / Bemerkungen zum Welpen">
						<textarea
							style={{ minHeight: 80 }}
							value={welpe.bemerkungen}
							onChange={(e) => set('bemerkungen', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Hinweis aus der Deckgenehmigung">
						<textarea
							value={welpe.deckgenehmigung}
							onChange={(e) => set('deckgenehmigung', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Aufzuchtbedingungen">
						<textarea
							value={welpe.aufzucht}
							onChange={(e) => set('aufzucht', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Zustand der Hündin">
						<textarea
							value={welpe.hundin}
							onChange={(e) => set('hundin', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Unterschriften">
				<SignatureGrid
					signatures={[
						{ id: `sig-zw-${welpe.id}`, label: 'Zuchtwart' },
						{ id: `sig-zue-${welpe.id}`, label: 'Züchter' },
						{ id: `sig-zwa-${welpe.id}`, label: 'Zuchtwartanwärter' },
					]}
					values={signatures}
					onChange={onSignatureChange}
					readOnly={readOnly}
				/>
				<FieldRow cols={2} style={{ marginTop: 16 }}>
					<Field label="Ort">
						<input
							type="text"
							value={welpe.ort}
							onChange={(e) => set('ort', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
					<Field label="Datum">
						<input
							type="date"
							value={welpe.datum}
							onChange={(e) => set('datum', e.target.value)}
							disabled={readOnly}
						/>
					</Field>
				</FieldRow>
			</Card>

			<PdfAnleitung formData={formData} deletedIds={deletedIds} />
		</div>
	)
}
