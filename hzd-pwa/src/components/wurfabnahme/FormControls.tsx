import type { CSSProperties, ReactNode } from 'react'
import { SignatureCanvas } from './SignatureCanvas'

export function Card({
	children,
	title,
}: {
	children: ReactNode
	title: string
}) {
	return (
		<div className="wa-card">
			<div className="wa-section-header">{title}</div>
			{children}
		</div>
	)
}

export function Field({
	label,
	children,
}: {
	label: string
	children: ReactNode
}) {
	return (
		<div className="wa-field">
			<label>{label}</label>
			{children}
		</div>
	)
}

export function FieldRow({
	cols,
	children,
	style,
}: {
	cols?: 2 | 3
	children: ReactNode
	style?: CSSProperties
}) {
	const colClass = cols === 2 ? 'col-2' : cols === 3 ? 'col-3' : ''
	return (
		<div
			className={`wa-field-row ${colClass}`.trim()}
			style={style}
		>
			{children}
		</div>
	)
}

export function RadioGroup({
	name,
	options,
}: {
	name: string
	options: string[]
}) {
	return (
		<div className="wa-check-options">
			{options.map((option) => (
				<label key={option} className="wa-rb-item">
					<input type="radio" name={name} value={option} />
					<span className="wa-rb-dot" />
					<span>{option}</span>
				</label>
			))}
		</div>
	)
}

export function CheckboxGroup({
	options,
	vertical = false,
}: {
	options: string[]
	vertical?: boolean
}) {
	return (
		<div className={`wa-check-group${vertical ? ' vertical' : ''}`}>
			{options.map((option) => (
				<label key={option} className="wa-cb-item">
					<input type="checkbox" />
					<span className="wa-cb-box" />
					<span>{option}</span>
				</label>
			))}
		</div>
	)
}

export function CheckRow({
	label,
	children,
}: {
	label: string
	children: ReactNode
}) {
	return (
		<div className="wa-check-row">
			<div className="wa-check-label">{label}</div>
			<div className="wa-check-options">{children}</div>
		</div>
	)
}

export function BesonderheitInput() {
	return (
		<div className="wa-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
			<span className="wa-inline-label">Besonderheit:</span>
			<input type="text" className="wa-inline-input" />
		</div>
	)
}

export function PdfAnleitung() {
	return (
		<div className="wa-pdf-anleitung">
			<strong>📄 Als PDF speichern – Android Tablet</strong>
			<ol>
				<li>
					Auf <b>„PDF erstellen“</b> tippen
				</li>
				<li>Es öffnet sich der Druckdialog</li>
				<li>
					Oben bei <b>„Drucker auswählen“</b> tippen →{' '}
					<b>„Als PDF speichern“</b> wählen
				</li>
				<li>
					Oben rechts auf das <b>PDF-Symbol</b> tippen → Speichern
				</li>
			</ol>
			<button
				type="button"
				className="wa-pdf-btn"
				onClick={() => window.print()}
			>
				📄 PDF erstellen / Drucken
			</button>
		</div>
	)
}

export function SignatureGrid({
	signatures,
}: {
	signatures: { id: string; label: string }[]
}) {
	return (
		<div className="wa-sig-grid">
			{signatures.map((sig) => (
				<div key={sig.id}>
					<SignatureCanvas id={sig.id} label={sig.label} />
				</div>
			))}
		</div>
	)
}
