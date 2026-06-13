'use client'

import { useEffect, useState } from 'react'
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

interface WelpenRow {
	r: boolean
	h: boolean
}

interface StammblattPageProps {
	welpenAnzahl: number
	onWelpenAnzahlChange: (value: number) => void
	onNext: () => void
}

function WelpenTable({
	count,
	rows,
	onToggle,
}: {
	count: number
	rows: WelpenRow[]
	onToggle: (index: number, field: 'r' | 'h') => void
}) {
	const welpenCount = Math.min(Math.max(count, 1), 14)

	return (
		<div style={{ overflowX: 'auto' }}>
			<table className="wa-welpen-table">
				<thead>
					<tr>
						<th style={{ width: 36 }}>#</th>
						<th>Zuchtbuch-Nr. / Register-Nr.</th>
						<th style={{ width: 36, textAlign: 'center' }}>R</th>
						<th style={{ width: 36, textAlign: 'center' }}>H</th>
						<th>Name Welpe</th>
						<th style={{ width: 70 }}>Farbe</th>
						<th>Chipnummer</th>
						<th>Gechippt am</th>
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: welpenCount }, (_, i) => (
						<tr key={i}>
							<td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
							<td>
								<span style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
									VDH-HZD{' '}
								</span>
								<input type="text" placeholder="Nr." style={{ width: 100 }} />
							</td>
							<td style={{ textAlign: 'center' }}>
								<div
									className={`wa-cb-small${rows[i]?.r ? ' checked' : ''}`}
									onClick={() => onToggle(i, 'r')}
									role="checkbox"
									aria-checked={rows[i]?.r ?? false}
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') {
											e.preventDefault()
											onToggle(i, 'r')
										}
									}}
								/>
							</td>
							<td style={{ textAlign: 'center' }}>
								<div
									className={`wa-cb-small${rows[i]?.h ? ' checked' : ''}`}
									onClick={() => onToggle(i, 'h')}
									role="checkbox"
									aria-checked={rows[i]?.h ?? false}
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') {
											e.preventDefault()
											onToggle(i, 'h')
										}
									}}
								/>
							</td>
							<td>
								<input type="text" placeholder="Name" />
							</td>
							<td>
								<input
									type="text"
									placeholder="sm/b/s"
									style={{ width: 60 }}
								/>
							</td>
							<td>
								<input type="text" placeholder="Chip-Nr." />
							</td>
							<td>
								<input type="date" />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export function StammblattPage({
	welpenAnzahl,
	onWelpenAnzahlChange,
	onNext,
}: StammblattPageProps) {
	const [welpenRows, setWelpenRows] = useState<WelpenRow[]>([])

	useEffect(() => {
		const count = Math.min(Math.max(welpenAnzahl, 1), 14)
		setWelpenRows((prev) =>
			Array.from({ length: count }, (_, i) => prev[i] ?? { r: false, h: false }),
		)
	}, [welpenAnzahl])

	const handleToggle = (index: number, field: 'r' | 'h') => {
		setWelpenRows((prev) =>
			prev.map((row, i) => {
				if (i !== index) return row
				if (field === 'r') return { r: !row.r, h: false }
				return { r: false, h: !row.h }
			}),
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
						<input type="text" />
					</Field>
					<Field label="Datum">
						<input type="date" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Zwingername">
						<input type="text" />
					</Field>
					<Field label="Wurf im Zwinger (Nr.)">
						<input type="text" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Straße / Nr.">
						<input type="text" />
					</Field>
					<Field label="PLZ / Ort">
						<input type="text" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Telefon">
						<input type="text" />
					</Field>
					<Field label="E-Mail">
						<input type="email" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Wurfinformationen">
				<FieldRow cols={2}>
					<Field label="Wurf gefallen am">
						<input type="date" />
					</Field>
					<Field label="Anzahl Welpen">
						<input
							type="number"
							min={1}
							max={14}
							value={welpenAnzahl}
							onChange={(e) =>
								onWelpenAnzahlChange(Number(e.target.value) || 1)
							}
						/>
					</Field>
				</FieldRow>
			</Card>

			<Card title="Welpen – Übersicht">
				<WelpenTable
					count={welpenAnzahl}
					rows={welpenRows}
					onToggle={handleToggle}
				/>
			</Card>

			<Card title="Beurteilung">
				<FieldRow>
					<Field label="Gesamteindruck">
						<textarea />
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Pflegezustand / Aufzuchtbedingungen">
						<textarea />
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Zustand der Hündin">
						<textarea />
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
				/>
				<FieldRow cols={2} style={{ marginTop: 16 }}>
					<Field label="Ort">
						<input type="text" />
					</Field>
					<Field label="Datum">
						<input type="date" />
					</Field>
				</FieldRow>
			</Card>

			<PdfAnleitung />

			<div className="wa-btn-row">
				<button type="button" className="wa-btn-primary" onClick={onNext}>
					Weiter zu Welpe 1 →
				</button>
			</div>
		</div>
	)
}

export function WelpePage({
	onBack,
	onNext,
}: {
	onBack: () => void
	onNext: () => void
}) {
	return (
		<div className="wa-page active" id="page-welpe1">
			<div className="wa-badge">Welpe 1</div>
			<div className="wa-page-title">Wurfabnahmeprotokoll</div>
			<div className="wa-page-subtitle">Einzelblatt Welpe</div>

			<Card title="Grunddaten">
				<FieldRow cols={2}>
					<Field label="Zuchtbuch-Nr. VDH-HZD">
						<input type="text" />
					</Field>
					<Field label="Wurftag">
						<input type="date" />
					</Field>
				</FieldRow>
				<FieldRow cols={3}>
					<Field label="Gewicht Geburt (g)">
						<input type="number" />
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
						<input type="text" />
					</Field>
					<Field label="Zuletzt am">
						<input type="date" />
					</Field>
					<Field label="Anzahl Wurmkuren">
						<input type="number" min={0} />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Wurfbesichtigung am">
						<input type="date" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Feststellungen bei der Wurfabnahme">
				<FieldRow cols={3}>
					<Field label="Chip Nr.">
						<input type="text" />
					</Field>
					<Field label="Gechippt am">
						<input type="date" />
					</Field>
					<Field label="Gewicht Wurfabnahme (g)">
						<input type="number" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Geimpft am">
						<input type="date" />
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
							<input type="checkbox" />
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
					<BesonderheitInput />
				</CheckRow>
				<CheckRow label="Augen">
					<RadioGroup name="w1-augen" options={['dunkel', 'mittel', 'hell']} />
					<BesonderheitInput />
				</CheckRow>
				<CheckRow label="Gebiss">
					<RadioGroup
						name="w1-gebiss"
						options={['Schere', 'Vorbiss', 'Rückbiss', 'Zange']}
					/>
				</CheckRow>
				<CheckRow label="Stellung Canini">
					<RadioGroup name="w1-canini" options={['korrekt']} />
					<BesonderheitInput />
				</CheckRow>
				<CheckRow label="Rute">
					<RadioGroup name="w1-rute" options={['korrekt', 'Rutenveränderung']} />
					<RadioGroup name="w1-rute-pos" options={['Ansatz', 'Mitte', 'Spitze']} />
				</CheckRow>
				<CheckRow label="Nabel">
					<RadioGroup name="w1-nabel" options={['korrekt']} />
					<BesonderheitInput />
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
						<textarea style={{ minHeight: 80 }} />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="Hinweis aus der Deckgenehmigung">
						<textarea />
					</Field>
					<Field label="Aufzuchtbedingungen">
						<textarea />
					</Field>
				</FieldRow>
				<FieldRow>
					<Field label="Zustand der Hündin">
						<textarea />
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
				/>
				<FieldRow cols={2} style={{ marginTop: 16 }}>
					<Field label="Ort">
						<input type="text" />
					</Field>
					<Field label="Datum">
						<input type="date" />
					</Field>
				</FieldRow>
			</Card>

			<PdfAnleitung />

			<div className="wa-btn-row">
				<button type="button" className="wa-btn-secondary" onClick={onBack}>
					← Stammblatt
				</button>
				<button type="button" className="wa-btn-primary" onClick={onNext}>
					Weiter: Datenschutz →
				</button>
			</div>
		</div>
	)
}

export function DatenschutzPage({ onBack }: { onBack: () => void }) {
	return (
		<div className="wa-page active" id="page-datenschutz1">
			<div className="wa-badge">Welpe 1</div>
			<div className="wa-page-title">Einwilligung zum Datenschutz</div>
			<div className="wa-page-subtitle">Welpenkäufer</div>

			<Card title="Welpenkäufer">
				<FieldRow cols={2}>
					<Field label="Name, Vorname">
						<input type="text" />
					</Field>
					<Field label="Geburtsdatum">
						<input type="date" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="PLZ / Ort">
						<input type="text" />
					</Field>
					<Field label="Straße / Nr.">
						<input type="text" />
					</Field>
				</FieldRow>
				<FieldRow cols={2}>
					<Field label="E-Mail">
						<input type="email" />
					</Field>
					<Field label="Telefon">
						<input type="text" />
					</Field>
				</FieldRow>
			</Card>

			<Card title="Hundedaten">
				<FieldRow cols={3}>
					<Field label="Welpe (Name)">
						<input type="text" />
					</Field>
					<Field label="Zwinger">
						<input type="text" />
					</Field>
					<Field label="Züchter">
						<input type="text" />
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
					options={[
						'Das Wurfabnahmeprotokoll wurde mit mir besprochen.',
						'Auf besondere Feststellungen wurde ich hingewiesen.',
						'Das Protokoll wurde mir ausgehändigt.',
					]}
				/>
			</Card>

			<Card title="Deckgenehmigung">
				<label className="wa-cb-item">
					<input type="checkbox" />
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
						<input type="radio" name="ds1-datenweitergabe" />
						<span className="wa-rb-dot" />
						<span>
							Ich willige ein, dass meine personenbezogenen Daten (Name,
							Vorname, Geburtsdatum, Anschrift, Telefonnummer, E-Mail-Adresse)
							von der HZD e.V. zur Speicherung und weiteren Verarbeitung im
							Rahmen der Zuchtbetreuung verwendet werden dürfen (Art. 6 DSGVO).
						</span>
					</label>
					<label className="wa-rb-item">
						<input type="radio" name="ds1-datenweitergabe" />
						<span className="wa-rb-dot" />
						<span>Ich willige nicht ein.</span>
					</label>
				</div>

				<div className="wa-consent-text">
					Informationen zum Verein / Veranstaltungen
				</div>
				<div className="wa-check-group vertical">
					<label className="wa-rb-item">
						<input type="radio" name="ds1-info" />
						<span className="wa-rb-dot" />
						<span>
							Ich willige ein, dass die HZD e.V. mir Informationen zum Verein
							oder zu Veranstaltungen per Post oder E-Mail zusendet (Art. 6
							DSGVO).
						</span>
					</label>
					<label className="wa-rb-item">
						<input type="radio" name="ds1-info" />
						<span className="wa-rb-dot" />
						<span>Ich willige nicht ein.</span>
					</label>
				</div>
			</Card>

			<Card title="Unterschrift Welpenkäufer">
				<FieldRow cols={2} style={{ marginBottom: 12 }}>
					<Field label="Ort / Datum">
						<input type="text" />
					</Field>
				</FieldRow>
				<div style={{ maxWidth: 400 }}>
					<SignatureGrid
						signatures={[{ id: 'sig-ds1', label: 'Unterschrift Welpenkäufer' }]}
					/>
				</div>
			</Card>

			<PdfAnleitung />

			<div className="wa-btn-row">
				<button type="button" className="wa-btn-secondary" onClick={onBack}>
					← Welpe 1
				</button>
			</div>
		</div>
	)
}
