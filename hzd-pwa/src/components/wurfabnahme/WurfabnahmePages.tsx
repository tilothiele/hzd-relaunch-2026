'use client'

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
	MAX_WELPEN_ROWS,
	MIN_WELPEN_ROWS,
	WELPEN_FARBE_OPTIONS,
	WELPEN_GESCHLECHT_OPTIONS,
	WURF_NR_OPTIONS,
	type StammblattData,
	type WelpenFarbe,
	type WelpenGeschlecht,
	type WelpenRowData,
} from '@/types/wurfabnahme-form'

interface SignatureProps {
	signatures: Record<string, string>
	onSignatureChange: (id: string, dataUrl: string) => void
	readOnly?: boolean
}

interface StammblattPageProps extends SignatureProps {
	data: StammblattData
	onChange: (data: StammblattData) => void
}

function WelpenTable({
	rows,
	onRemove,
	onUpdate,
}: {
	rows: WelpenRowData[]
	onRemove: (index: number) => void
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
					{rows.map((row, i) => (
						<tr key={row.id}>
							<td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
							<td>
								<span style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
									VDH-HZD{' '}
								</span>
								<input
									type="text"
									placeholder="Nr."
									style={{ width: 100 }}
									value={row.zuchtbuchNr}
									onChange={(e) =>
										onUpdate(i, 'zuchtbuchNr', e.target.value)
									}
								/>
							</td>
							<td>
								<select
									className="wa-select-compact"
									value={row.geschlecht}
									onChange={(e) =>
										onUpdate(
											i,
											'geschlecht',
											e.target.value as WelpenGeschlecht,
										)
									}
								>
									<option value="">–</option>
									{WELPEN_GESCHLECHT_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</td>
							<td>
								<input
									type="text"
									placeholder="Name"
									value={row.name}
									onChange={(e) => onUpdate(i, 'name', e.target.value)}
								/>
							</td>
							<td>
								<select
									className="wa-select-compact"
									value={row.farbe}
									onChange={(e) =>
										onUpdate(i, 'farbe', e.target.value as WelpenFarbe)
									}
								>
									<option value="">–</option>
									{WELPEN_FARBE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</td>
							<td>
								<input
									type="text"
									placeholder="Chip-Nr."
									value={row.chipNr}
									onChange={(e) => onUpdate(i, 'chipNr', e.target.value)}
								/>
							</td>
							<td>
								<input
									type="date"
									value={row.gechiptAm}
									onChange={(e) => onUpdate(i, 'gechiptAm', e.target.value)}
								/>
							</td>
							<td>
								<input
									type="date"
									value={row.verstorbenAm}
									onChange={(e) =>
										onUpdate(i, 'verstorbenAm', e.target.value)
									}
								/>
							</td>
							<td className="wa-col-actions" style={{ textAlign: 'center' }}>
								<button
									type="button"
									className="wa-btn-icon"
									onClick={() => onRemove(i)}
									disabled={rows.length <= MIN_WELPEN_ROWS}
									title="Zeile entfernen"
									aria-label={`Welpe ${i + 1} entfernen`}
								>
									×
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export function StammblattPage({
	data,
	onChange,
	signatures,
	onSignatureChange,
	readOnly,
}: StammblattPageProps) {
	const updateField = <K extends keyof StammblattData>(
		field: K,
		value: StammblattData[K],
	) => {
		onChange({ ...data, [field]: value })
	}

	const handleAddRow = () => {
		if (data.welpen.length >= MAX_WELPEN_ROWS) return
		updateField('welpen', [...data.welpen, createWelpenRow()])
	}

	const handleRemoveRow = (index: number) => {
		if (data.welpen.length <= MIN_WELPEN_ROWS) return
		updateField(
			'welpen',
			data.welpen.filter((_, i) => i !== index),
		)
	}

	const handleWelpeUpdate = (
		index: number,
		field: keyof WelpenRowData,
		value: string,
	) => {
		updateField(
			'welpen',
			data.welpen.map((row, i) =>
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
						<input
							type="text"
							value={data.zuechterName}
							onChange={(e) => updateField('zuechterName', e.target.value)}
						/>
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
						<input
							type="text"
							value={data.zuchthuendin}
							onChange={(e) =>
								updateField('zuchthuendin', e.target.value)
							}
						/>
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
						Anzahl Welpen: <strong>{data.welpen.length}</strong>
					</p>
					<div className="wa-btn-row-action">
						<button
							type="button"
							className="wa-btn-secondary wa-btn-add-row"
							onClick={handleAddRow}
							disabled={data.welpen.length >= MAX_WELPEN_ROWS}
						>
							+ Zeile hinzufügen
						</button>
					</div>
				</div>
				<WelpenTable
					rows={data.welpen}
					onRemove={handleRemoveRow}
					onUpdate={handleWelpeUpdate}
				/>
			</Card>

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

			<PdfAnleitung />
		</div>
	)
}

export function WelpePage({
	signatures,
	onSignatureChange,
	readOnly,
}: SignatureProps) {
	return (
		<div className="wa-page active" id="page-welpe1">
			<div className="wa-badge">Welpe 1</div>
			<div className="wa-page-title">Wurfabnahmeprotokoll</div>
			<div className="wa-page-subtitle">Einzelblatt Welpe</div>

			<Card title="Grunddaten">
				<FieldRow cols={2}>
					<Field label="Zuchtbuch-Nr. VDH-HZD">
						<input type="text" name="w1-zbnr" />
					</Field>
					<Field label="Wurftag">
						<input type="date" name="w1-wurftag" />
					</Field>
				</FieldRow>
				<FieldRow cols={3}>
					<Field label="Gewicht Geburt (g)">
						<input type="number" name="w1-gewicht-geburt" />
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
							<input type="radio" name="w1-rh" value="R" />
							<span className="wa-rb-dot" />
							<span>Rüde</span>
						</label>
						<label className="wa-rb-item">
							<input type="radio" name="w1-rh" value="H" />
							<span className="wa-rb-dot" />
							<span>Hündin</span>
						</label>
					</div>
				</FieldRow>
				<FieldRow cols={3}>
					<Field label="Entwurmt mit">
						<input type="text" name="w1-entwurmt" />
					</Field>
					<Field label="Zuletzt am">
						<input type="date" name="w1-entwurmt-am" />
					</Field>
					<Field label="Anzahl Wurmkuren">
						<input type="number" min={0} name="w1-wurmkuren" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Wurfbesichtigung am">
						<input type="date" name="w1-wurfbesichtigung" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Feststellungen bei der Wurfabnahme">
				<FieldRow cols={3}>
					<Field label="Chip Nr.">
						<input type="text" name="w1-chip" />
					</Field>
					<Field label="Gechippt am">
						<input type="date" name="w1-gechipt" />
					</Field>
					<Field label="Gewicht Wurfabnahme (g)">
						<input type="number" name="w1-gewicht-wa" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Geimpft am">
						<input type="date" name="w1-geimpft" />
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
							<input type="checkbox" name="w1-impfungen-io" />
							<span className="wa-cb-box" />
							<span>Impfungen lt. Heimtierausweis i.O.</span>
						</label>
					</div>
				</FieldRow>
			</Card>

			<Card title="Exterieur">
				<CheckRow label="Körperbau">
					<RadioGroup
						name="w1-koerperbau"
						options={['kräftig', 'mittelkräftig', 'leicht']}
					/>
				</CheckRow>
				<CheckRow label="Kopfform">
					<RadioGroup name="w1-kopfform" options={['kräftig', 'mittel', 'zart']} />
				</CheckRow>
				<CheckRow label="Stopp">
					<RadioGroup name="w1-stopp" options={['mittel', 'stark', 'wenig']} />
				</CheckRow>
				<CheckRow label="Ohren">
					<RadioGroup name="w1-ohren" options={['groß', 'mittel', 'klein']} />
					<BesonderheitInput name="w1-ohren-bes" />
				</CheckRow>
				<CheckRow label="Augen">
					<RadioGroup name="w1-augen" options={['dunkel', 'mittel', 'hell']} />
					<BesonderheitInput name="w1-augen-bes" />
				</CheckRow>
				<CheckRow label="Gebiss">
					<RadioGroup
						name="w1-gebiss"
						options={['Schere', 'Vorbiss', 'Rückbiss', 'Zange']}
					/>
				</CheckRow>
				<CheckRow label="Stellung Canini">
					<RadioGroup name="w1-canini" options={['korrekt']} />
					<BesonderheitInput name="w1-canini-bes" />
				</CheckRow>
				<CheckRow label="Rute">
					<RadioGroup name="w1-rute" options={['korrekt', 'Rutenveränderung']} />
					<RadioGroup name="w1-rute-pos" options={['Ansatz', 'Mitte', 'Spitze']} />
				</CheckRow>
				<CheckRow label="Nabel">
					<RadioGroup name="w1-nabel" options={['korrekt']} />
					<BesonderheitInput name="w1-nabel-bes" />
				</CheckRow>
				<CheckRow label="Hoden">
					<RadioGroup
						name="w1-hoden"
						options={['beide tastbar', 'einer tastbar', 'keiner tastbar']}
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
								name="w1-sw-deckhaar"
								options={[
									'tiefschwarz',
									'schwarz',
									'bräunlich',
									'gräulich',
									'rötlich',
								]}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Markenfarbe</div>
							<RadioGroup
								name="w1-markenfarbe"
								options={[
									'mittelblond',
									'dunkelblond',
									'hellblond/weißlich',
									'grau',
								]}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Markenzeichnung</div>
							<RadioGroup
								name="w1-markenzeichnung"
								options={[
									'komplett',
									'knapp',
									'überzeichnet',
									'teilweise fehlend',
								]}
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
								name="w1-bl-deckhaar"
								options={['mittelblond', 'dunkelblond', 'hellblond']}
							/>
						</div>
						<div className="wa-farbe-row">
							<div className="wa-farbe-row-label">Aufhellungen</div>
							<RadioGroup
								name="w1-aufhellungen"
								options={['vorhanden', 'wenig', 'keine']}
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
								name="w1-sw2-deckhaar"
								options={[
									'tiefschwarz',
									'schwarz',
									'bräunlich',
									'gräulich',
									'rötlich',
								]}
							/>
						</div>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Weiße Abzeichen</div>
					<div className="wa-farbe-body">
						<CheckboxGroup
							name="w1-weiss"
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
						/>
					</div>
				</div>

				<div className="wa-farbe-section">
					<div className="wa-farbe-header">Pigment</div>
					<div className="wa-farbe-body">
						<RadioGroup
							name="w1-pigment"
							options={['durchgefärbt', 'mittel', 'schwach']}
						/>
					</div>
				</div>
			</Card>

			<Card title="Verhalten">
				<CheckboxGroup
					name="w1-verhalten"
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
				/>
			</Card>

			<Card title="Bemerkungen">
				<FieldRow>
					<Field label="Abweichungen / Bemerkungen zum Welpen">
						<textarea style={{ minHeight: 80 }} name="w1-bemerkungen" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Hinweis aus der Deckgenehmigung">
						<textarea name="w1-deckgenehmigung" />
					</Field>
					<Field label="Aufzuchtbedingungen">
						<textarea name="w1-aufzucht" />
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Zustand der Hündin">
						<textarea name="w1-hundin" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Unterschriften">
				<SignatureGrid
					signatures={[
						{ id: 'sig-zw-w1', label: 'Zuchtwart' },
						{ id: 'sig-zue-w1', label: 'Züchter' },
						{ id: 'sig-zwa-w1', label: 'Zuchtwartanwärter' },
					]}
					values={signatures}
					onChange={onSignatureChange}
					readOnly={readOnly}
				/>
				<FieldRow cols={2} style={{ marginTop: 16 }}>
					<Field label="Ort">
						<input type="text" name="w1-ort" />
					</Field>
					<Field label="Datum">
						<input type="date" name="w1-datum" />
					</Field>
				</FieldRow>
			</Card>

			<PdfAnleitung />
		</div>
	)
}

export function DatenschutzPage({
	signatures,
	onSignatureChange,
	readOnly,
}: SignatureProps) {
	return (
		<div className="wa-page active" id="page-datenschutz1">
			<div className="wa-badge">Welpe 1</div>
			<div className="wa-page-title">Einwilligung zum Datenschutz</div>
			<div className="wa-page-subtitle">Welpenkäufer</div>

			<Card title="Welpenkäufer">
				<FieldRow cols={2}>
					<Field label="Name, Vorname">
						<input type="text" name="ds1-name" />
					</Field>
					<Field label="Geburtsdatum">
						<input type="date" name="ds1-geburt" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="PLZ / Ort">
						<input type="text" name="ds1-plz" />
					</Field>
					<Field label="Straße / Nr.">
						<input type="text" name="ds1-strasse" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="E-Mail">
						<input type="email" name="ds1-email" />
					</Field>
					<Field label="Telefon">
						<input type="text" name="ds1-telefon" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Hundedaten">
				<FieldRow cols={3}>
					<Field label="Welpe (Name)">
						<input type="text" name="ds1-welpe" />
					</Field>
					<Field label="Zwinger">
						<input type="text" name="ds1-zwinger" />
					</Field>
					<Field label="Züchter">
						<input type="text" name="ds1-zuechter" />
					</Field>
				</FieldRow>
				<div className="wa-info-box" style={{ marginTop: 8 }}>
					Mit dem Erwerb des Welpen der Rasse Hovawart wurde mir erläutert und
					ist mir bekannt, dass die Daten des Hundes – bestehend aus
					Zwingernamen, Rufnamen, Geburtsdatum, Geschlecht, Farbe und
					Chipnummer – zu züchterischen Zwecken in der Datenbank der HZD
					aufgenommen und gespeichert werden.
				</div>
			</Card>

			<Card title="Wurfabnahmeprotokoll">
				<CheckboxGroup
					vertical
					name="ds1-protokoll"
					options={[
						'Das Wurfabnahmeprotokoll wurde mit mir besprochen.',
						'Auf besondere Feststellungen wurde ich hingewiesen.',
						'Das Protokoll wurde mir ausgehändigt.',
					]}
				/>
			</Card>

			<Card title="Deckgenehmigung">
				<label className="wa-cb-item">
					<input type="checkbox" name="ds1-deckgenehmigung" />
					<span className="wa-cb-box" />
					<span>
						Der Hinweis aus der Deckgenehmigung, sofern vorhanden, wurde mir
						erläutert.
					</span>
				</label>
			</Card>

			<Card title="Einwilligung zur Verarbeitung personenbezogener Daten">
				<div className="wa-consent-text">Datenweitergabe an die HZD e.V.</div>
				<div className="wa-check-group vertical" style={{ marginBottom: 16 }}>
					<label className="wa-rb-item">
						<input type="radio" name="ds1-datenweitergabe" value="ja" />
						<span className="wa-rb-dot" />
						<span>
							Ich willige ein, dass meine personenbezogenen Daten (Name,
							Vorname, Geburtsdatum, Anschrift, Telefonnummer, E-Mail-Adresse)
							von der HZD e.V. zur Speicherung und weiteren Verarbeitung im
							Rahmen der Zuchtbetreuung verwendet werden dürfen (Art. 6 DSGVO).
						</span>
					</label>
					<label className="wa-rb-item">
						<input type="radio" name="ds1-datenweitergabe" value="nein" />
						<span className="wa-rb-dot" />
						<span>Ich willige nicht ein.</span>
					</label>
				</div>

				<div className="wa-consent-text">
					Informationen zum Verein / Veranstaltungen
				</div>
				<div className="wa-check-group vertical">
					<label className="wa-rb-item">
						<input type="radio" name="ds1-info" value="ja" />
						<span className="wa-rb-dot" />
						<span>
							Ich willige ein, dass die HZD e.V. mir Informationen zum Verein
							oder zu Veranstaltungen per Post oder E-Mail zusendet (Art. 6
							DSGVO).
						</span>
					</label>
					<label className="wa-rb-item">
						<input type="radio" name="ds1-info" value="nein" />
						<span className="wa-rb-dot" />
						<span>Ich willige nicht ein.</span>
					</label>
				</div>
			</Card>

			<Card title="Unterschrift Welpenkäufer">
				<FieldRow cols={2} style={{ marginBottom: 12 }}>
					<Field label="Ort / Datum">
						<input type="text" name="ds1-ort-datum" />
					</Field>
				</FieldRow>
				<div style={{ maxWidth: 400 }}>
					<SignatureGrid
						signatures={[
							{ id: 'sig-ds1', label: 'Unterschrift Welpenkäufer' },
						]}
						values={signatures}
						onChange={onSignatureChange}
						readOnly={readOnly}
					/>
				</div>
			</Card>

			<PdfAnleitung />
		</div>
	)
}
