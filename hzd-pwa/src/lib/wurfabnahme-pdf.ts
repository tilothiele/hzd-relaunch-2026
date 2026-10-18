import {
	PDFDocument,
	StandardFonts,
	rgb,
	type PDFFont,
	type PDFImage,
	type PDFPage,
} from 'pdf-lib'
import {
	DS_DECK_HINWEIS,
	DS_HUND_HINWEIS,
	DS_INFO_TEXT,
	DS_PROTOKOLL_OPTIONS,
	DS_WEITERGABE_TEXT,
	type StammblattData,
	type WelpenkaeuferData,
	type WelpenRowData,
	type WurfabnahmeFormData,
} from '@/types/wurfabnahme-form'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN_X = 36
const MARGIN_TOP = 28
const MARGIN_BOTTOM = 26
const INNER_W = PAGE_W - MARGIN_X * 2

const INK = rgb(0.1, 0.1, 0.12)
const MUTED = rgb(0.33, 0.33, 0.36)
const NAVY = rgb(0.122, 0.188, 0.404)
const RULE = rgb(0.72, 0.68, 0.6)
const WHITE = rgb(1, 1, 1)
const LOGO_SIZE = 48
const LOGO_GAP = 6

interface Pen {
	doc: PDFDocument
	page: PDFPage
	font: PDFFont
	bold: PDFFont
	y: number
	images: Map<string, PDFImage | null>
	logo: PDFImage | null
	wurfLabel: string
}

function formatDateDe(value: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
	if (!match) {
		return value
	}

	return `${match[3]}.${match[2]}.${match[1]}`
}

function show(value: string): string {
	const trimmed = value.trim()
	return trimmed || '—'
}

function sexLabel(value: string): string {
	if (value === 'R' || value === 'M') return 'Rüde'
	if (value === 'H' || value === 'F') return 'Hündin'
	return value
}

function colorLabel(value: string): string {
	if (value === 'S') return 'Schwarz'
	if (value === 'SM') return 'Schwarzmarken'
	if (value === 'B') return 'Blond'
	return value
}

function activeWelpen(
	formData: WurfabnahmeFormData,
	deletedIds?: ReadonlySet<string>,
): { welpe: WelpenRowData, nummer: number }[] {
	return formData.welpen.flatMap((welpe, index) => {
		if (welpe.deletedAt || deletedIds?.has(welpe.id)) {
			return []
		}

		return [{ welpe, nummer: index + 1 }]
	})
}

function clipText(
	font: PDFFont,
	text: string,
	size: number,
	width: number,
): string {
	if (font.widthOfTextAtSize(text, size) <= width) {
		return text
	}

	let result = text
	while (
		result.length > 1
		&& font.widthOfTextAtSize(`${result}…`, size) > width
	) {
		result = result.slice(0, -1)
	}

	return `${result}…`
}

function wrapText(
	font: PDFFont,
	text: string,
	size: number,
	width: number,
	maxLines: number,
): string[] {
	const words = text.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) {
		return []
	}

	const lines: string[] = []
	let current = ''

	for (const word of words) {
		const next = current ? `${current} ${word}` : word
		if (font.widthOfTextAtSize(next, size) <= width) {
			current = next
			continue
		}

		if (current) {
			lines.push(current)
		}
		current = word
		if (lines.length === maxLines) {
			break
		}
	}

	if (current && lines.length < maxLines) {
		lines.push(current)
	}

	if (lines.length === maxLines) {
		const last = lines.length - 1
		lines[last] = clipText(font, lines[last], size, width)
	}

	return lines
}

function pngBytes(dataUrl: string): Uint8Array | null {
	const marker = 'base64,'
	const index = dataUrl.indexOf(marker)
	if (index < 0) {
		return null
	}

	const binary = atob(dataUrl.slice(index + marker.length))
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}

	return bytes
}

async function signatureImage(pen: Pen, dataUrl: string): Promise<PDFImage | null> {
	if (!dataUrl) {
		return null
	}

	const cached = pen.images.get(dataUrl)
	if (cached !== undefined) {
		return cached
	}

	try {
		const bytes = pngBytes(dataUrl)
		if (!bytes) {
			pen.images.set(dataUrl, null)
			return null
		}

		const image = await pen.doc.embedPng(bytes)
		pen.images.set(dataUrl, image)
		return image
	} catch {
		pen.images.set(dataUrl, null)
		return null
	}
}

async function loadLogo(doc: PDFDocument): Promise<PDFImage | null> {
	try {
		const response = await fetch('/hzd-logo.png')
		if (!response.ok) {
			return null
		}

		const bytes = new Uint8Array(await response.arrayBuffer())
		return await doc.embedPng(bytes)
	} catch {
		return null
	}
}

function litterLabel(stamm: StammblattData): string {
	const zwinger = stamm.zwingername.trim()
	const wurf = stamm.wurfNr.trim()
	if (zwinger && wurf) {
		return `${zwinger}, ${wurf}-Wurf`
	}
	if (wurf) {
		return `${wurf}-Wurf`
	}
	return zwinger
}

function beginPage(pen: Pen, kicker: string, title: string) {
	pen.page = pen.doc.addPage([PAGE_W, PAGE_H])

	pen.page.drawRectangle({
		x: 0,
		y: PAGE_H - 22,
		width: PAGE_W,
		height: 22,
		color: NAVY,
	})
	pen.page.drawText('HZD e.V.  ·  Wurfabnahmeprotokoll', {
		x: MARGIN_X,
		y: PAGE_H - 15,
		size: 9,
		font: pen.bold,
		color: WHITE,
	})
	pen.page.drawText(kicker, {
		x: PAGE_W - MARGIN_X - pen.font.widthOfTextAtSize(kicker, 8),
		y: PAGE_H - 14.5,
		size: 8,
		font: pen.font,
		color: WHITE,
	})

	const logoBottom = PAGE_H - 22 - LOGO_GAP - LOGO_SIZE
	if (pen.logo) {
		pen.page.drawImage(pen.logo, {
			x: PAGE_W - MARGIN_X - LOGO_SIZE,
			y: logoBottom,
			width: LOGO_SIZE,
			height: LOGO_SIZE,
		})
	}

	const titleWidth = INNER_W - LOGO_SIZE - 12
	const litter = pen.wurfLabel.trim()
	if (litter) {
		const blockHeight = 13 + 4 + 9
		const blockBottom = logoBottom + (LOGO_SIZE - blockHeight) / 2
		pen.page.drawText(clipText(pen.bold, title, 13, titleWidth), {
			x: MARGIN_X,
			y: blockBottom + 13,
			size: 13,
			font: pen.bold,
			color: NAVY,
		})
		pen.page.drawText(clipText(pen.font, litter, 9, titleWidth), {
			x: MARGIN_X,
			y: blockBottom,
			size: 9,
			font: pen.font,
			color: INK,
		})
	} else {
		pen.page.drawText(clipText(pen.bold, title, 13, titleWidth), {
			x: MARGIN_X,
			y: logoBottom + (LOGO_SIZE - 13) / 2,
			size: 13,
			font: pen.bold,
			color: NAVY,
		})
	}

	pen.y = logoBottom - 12
}

function section(pen: Pen, title: string) {
	const height = 13
	pen.page.drawRectangle({
		x: MARGIN_X,
		y: pen.y - height,
		width: INNER_W,
		height,
		color: NAVY,
	})
	pen.page.drawText(title, {
		x: MARGIN_X + 4,
		y: pen.y - 9.5,
		size: 8,
		font: pen.bold,
		color: WHITE,
	})
	pen.y -= height + 6
}

function fieldRow(
	pen: Pen,
	cells: { label: string, value: string, flex?: number }[],
) {
	const gap = 10
	const flexSum = cells.reduce((sum, cell) => sum + (cell.flex ?? 1), 0)
	const width = INNER_W - gap * (cells.length - 1)
	let x = MARGIN_X

	cells.forEach((cell, index) => {
		const cellWidth = (width * (cell.flex ?? 1)) / flexSum
		pen.page.drawText(cell.label, {
			x,
			y: pen.y - 7,
			size: 6.5,
			font: pen.font,
			color: MUTED,
		})
		pen.page.drawText(
			clipText(pen.bold, show(cell.value), 9, cellWidth - 2),
			{
				x,
				y: pen.y - 18,
				size: 9,
				font: pen.bold,
				color: INK,
			},
		)
		pen.page.drawLine({
			start: { x, y: pen.y - 21 },
			end: { x: x + cellWidth, y: pen.y - 21 },
			thickness: 0.4,
			color: RULE,
		})
		x += cellWidth + (index < cells.length - 1 ? gap : 0)
	})

	pen.y -= 26
}

function textBlock(
	pen: Pen,
	label: string,
	value: string,
	maxLines: number,
) {
	pen.page.drawText(label, {
		x: MARGIN_X,
		y: pen.y - 7,
		size: 6.5,
		font: pen.font,
		color: MUTED,
	})
	pen.y -= 11

	const lines = wrapText(pen.font, value, 8, INNER_W, maxLines)
	const drawn = lines.length > 0 ? lines : ['—']
	drawn.forEach((line) => {
		pen.page.drawText(line, {
			x: MARGIN_X,
			y: pen.y - 8,
			size: 8,
			font: pen.font,
			color: INK,
		})
		pen.y -= 10
	})
	pen.y -= 4
}

function choiceLine(pen: Pen, label: string, value: string, extra = '') {
	const detail = [value.trim(), extra.trim()].filter(Boolean).join(' · ')
	const line = `${label}: ${detail || '—'}`
	pen.page.drawText(clipText(pen.font, line, 8, INNER_W), {
		x: MARGIN_X,
		y: pen.y - 8,
		size: 8,
		font: pen.font,
		color: INK,
	})
	pen.y -= 11
}

function paragraph(pen: Pen, text: string, maxLines: number) {
	const lines = wrapText(pen.font, text, 7.5, INNER_W, maxLines)
	lines.forEach((line) => {
		pen.page.drawText(line, {
			x: MARGIN_X,
			y: pen.y - 8,
			size: 7.5,
			font: pen.font,
			color: INK,
		})
		pen.y -= 9.5
	})
	pen.y -= 3
}

async function signatureRow(
	pen: Pen,
	items: { label: string, name: string, dataUrl: string }[],
) {
	const gap = 12
	const col = (INNER_W - gap * (items.length - 1)) / items.length
	const boxH = 36
	const top = pen.y

	for (let index = 0; index < items.length; index += 1) {
		const item = items[index]
		const x = MARGIN_X + index * (col + gap)
		pen.page.drawText(item.label, {
			x,
			y: top - 8,
			size: 7,
			font: pen.bold,
			color: NAVY,
		})

		const image = await signatureImage(pen, item.dataUrl)
		const boxY = top - 14 - boxH
		pen.page.drawRectangle({
			x,
			y: boxY,
			width: col,
			height: boxH,
			borderWidth: 0.4,
			borderColor: RULE,
		})
		if (image) {
			const scale = Math.min(
				(col - 4) / image.width,
				(boxH - 4) / image.height,
			)
			const width = image.width * scale
			const height = image.height * scale
			pen.page.drawImage(image, {
				x: x + 2,
				y: boxY + (boxH - height) / 2,
				width,
				height,
			})
		}

		pen.page.drawText(
			clipText(pen.font, show(item.name), 8, col),
			{
				x,
				y: boxY - 11,
				size: 8,
				font: pen.font,
				color: INK,
			},
		)
	}

	pen.y = top - 14 - boxH - 16
}

function drawStammblattSignatures(
	pen: Pen,
	stamm: StammblattData,
	signatures: Record<string, string>,
) {
	section(pen, 'Unterschriften')
	return signatureRow(pen, [
		{
			label: 'Zuchtwart',
			name: stamm.zuchtwartName,
			dataUrl: signatures['sig-zw-stamm'] ?? '',
		},
		{
			label: 'Züchter',
			name: stamm.zuechterUnterschriftName,
			dataUrl: signatures['sig-zue-stamm'] ?? '',
		},
		{
			label: 'Zuchtwartanwärter',
			name: stamm.zuchtanwaerterName,
			dataUrl: signatures['sig-zwa-stamm'] ?? '',
		},
	]).then(() => {
		fieldRow(pen, [
			{ label: 'Ort', value: stamm.ortStamm },
			{ label: 'Datum', value: formatDateDe(stamm.datumStamm) },
		])
	})
}

async function drawWelpe(
	pen: Pen,
	welpe: WelpenRowData,
	index: number,
	total: number,
	signatures: Record<string, string>,
) {
	const title = welpe.name.trim() || `Welpe ${index}`
	beginPage(pen, `Welpe ${index} von ${total}`, title)

	section(pen, 'Grunddaten')
	fieldRow(pen, [
		{ label: 'Zuchtbuch-Nr. VDH-HZD', value: welpe.zuchtbuchNr },
		{ label: 'Wurftag', value: formatDateDe(welpe.wurftag) },
		{ label: 'Geschlecht', value: sexLabel(welpe.rh || welpe.geschlecht) },
	])
	fieldRow(pen, [
		{ label: 'Farbe', value: colorLabel(welpe.farbe) },
		{ label: 'Gewicht Geburt (g)', value: welpe.gewichtGeburt },
		{ label: 'Entwurmt mit', value: welpe.entwurmt },
	])
	fieldRow(pen, [
		{ label: 'Zuletzt entwurmt am', value: formatDateDe(welpe.entwurmtAm) },
		{ label: 'Anzahl Wurmkuren', value: welpe.wurmkuren },
		{ label: 'Wurfbesichtigung am', value: formatDateDe(welpe.wurfbesichtigung) },
	])

	section(pen, 'Feststellungen bei der Wurfabnahme')
	fieldRow(pen, [
		{ label: 'Chip Nr.', value: welpe.chipNr },
		{ label: 'Gechippt am', value: formatDateDe(welpe.gechiptAm) },
		{ label: 'Gewicht Wurfabnahme (g)', value: welpe.gewichtWa },
	])
	fieldRow(pen, [
		{ label: 'Geimpft am', value: formatDateDe(welpe.geimpft) },
		{
			label: 'Impfungen lt. Heimtierausweis',
			value: welpe.impfungenIo ? 'i.O.' : '—',
		},
	])

	section(pen, 'Exterieur')
	choiceLine(pen, 'Körperbau', welpe.koerperbau)
	choiceLine(pen, 'Kopfform', welpe.kopfform)
	choiceLine(pen, 'Stopp', welpe.stopp)
	choiceLine(pen, 'Ohren', welpe.ohren, welpe.ohrenBes)
	choiceLine(pen, 'Augen', welpe.augen, welpe.augenBes)
	choiceLine(pen, 'Gebiss', welpe.gebiss)
	choiceLine(pen, 'Stellung Canini', welpe.canini, welpe.caniniBes)
	choiceLine(
		pen,
		'Rute',
		welpe.rute,
		welpe.rutePos ? `Ansatz: ${welpe.rutePos}` : '',
	)
	choiceLine(pen, 'Nabel', welpe.nabel, welpe.nabelBes)
	choiceLine(pen, 'Hoden', welpe.hoden)

	section(pen, 'Farbbeschreibung')
	choiceLine(pen, 'Schwarz mit Marken, Deckhaar', welpe.swDeckhaar)
	choiceLine(pen, 'Markenfarbe', welpe.markenfarbe)
	choiceLine(pen, 'Markenzeichnung', welpe.markenzeichnung)
	choiceLine(pen, 'Blond, Deckhaar', welpe.blDeckhaar)
	choiceLine(pen, 'Aufhellungen', welpe.aufhellungen)
	choiceLine(pen, 'Schwarz, Deckhaar', welpe.sw2Deckhaar)
	choiceLine(pen, 'Weiße Abzeichen', welpe.weiss.join(', '))
	choiceLine(pen, 'Pigment', welpe.pigment)

	section(pen, 'Verhalten')
	choiceLine(pen, 'Verhalten', welpe.verhalten.join(', '))

	section(pen, 'Bemerkungen')
	textBlock(pen, 'Abweichungen / Bemerkungen zum Welpen', welpe.bemerkungen, 2)
	textBlock(pen, 'Hinweis aus der Deckgenehmigung', welpe.deckgenehmigung, 2)
	textBlock(pen, 'Aufzuchtbedingungen', welpe.aufzucht, 1)
	textBlock(pen, 'Zustand der Hündin', welpe.hundin, 1)

	section(pen, 'Unterschriften')
	await signatureRow(pen, [
		{
			label: 'Zuchtwart',
			name: '',
			dataUrl: signatures[`sig-zw-${welpe.id}`] ?? '',
		},
		{
			label: 'Züchter',
			name: '',
			dataUrl: signatures[`sig-zue-${welpe.id}`] ?? '',
		},
		{
			label: 'Zuchtwartanwärter',
			name: '',
			dataUrl: signatures[`sig-zwa-${welpe.id}`] ?? '',
		},
	])
	fieldRow(pen, [
		{ label: 'Ort', value: welpe.ort },
		{ label: 'Datum', value: formatDateDe(welpe.datum) },
	])
	assertFits(pen, `Welpe ${index}`)
}

function formCheck(pen: Pen, name: string, label: string) {
	const box = 10
	const check = pen.doc.getForm().createCheckBox(name)
	check.addToPage(pen.page, {
		x: MARGIN_X,
		y: pen.y - box,
		width: box,
		height: box,
		borderWidth: 0.8,
		borderColor: NAVY,
	})

	const lines = wrapText(pen.font, label, 8, INNER_W - 16, 3)
	lines.forEach((line, index) => {
		pen.page.drawText(line, {
			x: MARGIN_X + 14,
			y: pen.y - 8 - index * 9,
			size: 8,
			font: pen.font,
			color: INK,
		})
	})
	pen.y -= Math.max(14, lines.length * 9 + 3)
}

function formYesNo(pen: Pen, name: string) {
	const box = 10
	const y = pen.y - box
	const group = pen.doc.getForm().createRadioGroup(name)
	const widget = {
		y,
		width: box,
		height: box,
		borderWidth: 0.8,
		borderColor: NAVY,
	}
	group.addOptionToPage('ja', pen.page, { ...widget, x: MARGIN_X })
	pen.page.drawText('Ja', {
		x: MARGIN_X + 14,
		y: pen.y - 8,
		size: 8,
		font: pen.font,
		color: INK,
	})
	group.addOptionToPage('nein', pen.page, { ...widget, x: MARGIN_X + 48 })
	pen.page.drawText('Nein', {
		x: MARGIN_X + 62,
		y: pen.y - 8,
		size: 8,
		font: pen.font,
		color: INK,
	})
	pen.y -= 16
}

function formText(pen: Pen, name: string, label: string) {
	pen.page.drawText(label, {
		x: MARGIN_X,
		y: pen.y - 8,
		size: 6.5,
		font: pen.font,
		color: MUTED,
	})
	const field = pen.doc.getForm().createTextField(name)
	field.addToPage(pen.page, {
		x: MARGIN_X,
		y: pen.y - 28,
		width: 260,
		height: 16,
		borderWidth: 0.6,
		borderColor: RULE,
		font: pen.font,
	})
	field.setFontSize(9)
	pen.y -= 36
}

function buyerName(buyer: WelpenkaeuferData): string {
	return [buyer.name.trim(), buyer.vorname.trim()].filter(Boolean).join(', ')
}

function buyerPuppies(
	buyer: WelpenkaeuferData,
	welpen: { welpe: WelpenRowData, nummer: number }[],
): string {
	return welpen
		.filter((entry) => buyer.welpenIds.includes(entry.welpe.id))
		.map((entry) => `${entry.nummer} ${entry.welpe.name.trim() || 'ohne Name'}`)
		.join(', ')
}

function drawDatenschutz(
	pen: Pen,
	buyer: WelpenkaeuferData,
	index: number,
	stamm: StammblattData,
	welpen: { welpe: WelpenRowData, nummer: number }[],
) {
	const heading = buyerName(buyer) || `Welpenkäufer ${index}`
	beginPage(pen, `Käufer ${index}`, heading)

	section(pen, 'Welpenkäufer')
	fieldRow(pen, [
		{ label: 'Name, Vorname', value: buyerName(buyer), flex: 2 },
		{ label: 'Geburtsdatum', value: formatDateDe(buyer.geburtsdatum) },
	])
	fieldRow(pen, [
		{ label: 'Straße / Nr.', value: buyer.strasse, flex: 2 },
		{ label: 'Land', value: buyer.land },
	])
	fieldRow(pen, [
		{ label: 'PLZ', value: buyer.plz },
		{ label: 'Ort', value: buyer.ort },
		{ label: 'Telefon', value: buyer.telefon },
	])
	fieldRow(pen, [
		{ label: 'E-Mail', value: '' },
	])

	section(pen, 'Hundedaten')
	fieldRow(pen, [
		{ label: 'Welpe (Name)', value: buyerPuppies(buyer, welpen), flex: 2 },
		{ label: 'Zwinger', value: stamm.zwingername },
		{ label: 'Züchter', value: stamm.zuechterName },
	])
	paragraph(pen, DS_HUND_HINWEIS, 4)

	section(pen, 'Wurfabnahmeprotokoll')
	DS_PROTOKOLL_OPTIONS.forEach((option, optionIndex) => {
		formCheck(pen, `kaeufer-${buyer.id}-protokoll-${optionIndex}`, option)
	})
	pen.y -= 2

	section(pen, 'Deckgenehmigung')
	formCheck(pen, `kaeufer-${buyer.id}-deck`, DS_DECK_HINWEIS)
	pen.y -= 2

	section(pen, 'Einwilligung zur Datenweitergabe an die HZD e.V.')
	paragraph(pen, DS_WEITERGABE_TEXT, 4)
	formYesNo(pen, `kaeufer-${buyer.id}-weitergabe`)

	section(pen, 'Informationen zum Verein / Veranstaltungen')
	paragraph(pen, DS_INFO_TEXT, 3)
	formYesNo(pen, `kaeufer-${buyer.id}-info`)

	section(pen, 'Unterschrift Welpenkäufer')
	formText(pen, `kaeufer-${buyer.id}-ort-datum`, 'Ort / Datum')
	return signatureRow(pen, [
		{
			label: 'Welpenkäufer',
			name: buyerName(buyer),
			dataUrl: '',
		},
	]).then(() => {
		assertFits(pen, `Welpenkäufer ${index}`)
	})
}

function assertFits(pen: Pen, name: string) {
	if (pen.y < MARGIN_BOTTOM) {
		throw new Error(`${name} passt nicht auf eine DIN-A4-Seite.`)
	}
}

function stampFooters(doc: PDFDocument, font: PDFFont) {
	const pages = doc.getPages()
	pages.forEach((page, index) => {
		const label = `Seite ${index + 1} von ${pages.length}`
		page.drawText(label, {
			x: PAGE_W - MARGIN_X - font.widthOfTextAtSize(label, 7),
			y: 14,
			size: 7,
			font,
			color: MUTED,
		})
	})
}

async function openDocument(stamm: StammblattData): Promise<Pen> {
	const doc = await PDFDocument.create()
	const font = await doc.embedFont(StandardFonts.Helvetica)
	const bold = await doc.embedFont(StandardFonts.HelveticaBold)
	const pen: Pen = {
		doc,
		page: doc.addPage([PAGE_W, PAGE_H]),
		font,
		bold,
		y: PAGE_H,
		images: new Map(),
		logo: await loadLogo(doc),
		wurfLabel: litterLabel(stamm),
	}
	doc.removePage(0)
	return pen
}

async function saveDocument(pen: Pen, title: string): Promise<Uint8Array> {
	const form = pen.doc.getForm()
	if (form.getFields().length > 0) {
		form.updateFieldAppearances(pen.font)
	}
	stampFooters(pen.doc, pen.font)
	pen.doc.setTitle(title)
	pen.doc.setAuthor('HZD e.V.')
	return pen.doc.save()
}

export async function buildWurfabnahmePdf(
	formData: WurfabnahmeFormData,
	deletedIds?: ReadonlySet<string>,
): Promise<Uint8Array> {
	const pen = await openDocument(formData.stammblatt)
	const welpen = activeWelpen(formData, deletedIds)
	const stamm = formData.stammblatt
	beginPage(pen, 'Stammblatt', 'Stammblatt')
	section(pen, 'Züchter')
	fieldRow(pen, [
		{ label: 'Name', value: stamm.zuechterName, flex: 2 },
		{ label: 'Datum', value: formatDateDe(stamm.datum) },
	])
	fieldRow(pen, [
		{ label: 'Zwingername', value: stamm.zwingername, flex: 2 },
		{ label: 'Wurf im Zwinger (Nr.)', value: stamm.wurfNr },
	])
	fieldRow(pen, [
		{ label: 'Straße / Nr.', value: stamm.strasse },
		{ label: 'PLZ / Ort', value: stamm.plzOrt },
	])
	fieldRow(pen, [
		{ label: 'Telefon', value: stamm.telefon },
		{ label: 'E-Mail', value: stamm.email },
	])
	section(pen, 'Wurfinformationen')
	fieldRow(pen, [
		{ label: 'Zuchthündin', value: stamm.zuchthuendin, flex: 2 },
		{ label: 'Zuchtbuch-Nr.', value: stamm.zuchtbuchNrHuendin },
		{ label: 'Wurf gefallen am', value: formatDateDe(stamm.wurfGefallenAm) },
	])
	section(pen, 'Welpen')
	drawWelpenTable(pen, welpen)
	section(pen, 'Beurteilung')
	textBlock(pen, 'Gesamteindruck', stamm.gesamteindruck, 2)
	textBlock(pen, 'Pflegezustand / Aufzuchtbedingungen', stamm.pflegezustand, 2)
	textBlock(pen, 'Zustand der Hündin', stamm.zustandHundin, 2)
	await drawStammblattSignatures(pen, stamm, formData.signatures ?? {})
	assertFits(pen, 'Stammblatt')

	for (let index = 0; index < welpen.length; index += 1) {
		await drawWelpe(
			pen,
			welpen[index].welpe,
			index + 1,
			welpen.length,
			formData.signatures ?? {},
		)
	}

	return saveDocument(pen, 'Wurfabnahmeprotokoll')
}

export async function buildWelpenkaeuferPdf(
	formData: WurfabnahmeFormData,
	buyerId: string,
	deletedIds?: ReadonlySet<string>,
): Promise<Uint8Array> {
	const buyers = formData.welpenkaeufer ?? []
	const buyerIndex = buyers.findIndex((buyer) => buyer.id === buyerId)
	if (buyerIndex < 0) {
		throw new Error('Welpenkäufer nicht gefunden.')
	}

	const pen = await openDocument(formData.stammblatt)
	await drawDatenschutz(
		pen,
		buyers[buyerIndex],
		buyerIndex + 1,
		formData.stammblatt,
		activeWelpen(formData, deletedIds),
	)
	const title = buyerName(buyers[buyerIndex]) || `Welpenkäufer ${buyerIndex + 1}`
	return saveDocument(pen, title)
}

function drawWelpenTable(
	pen: Pen,
	welpen: { welpe: WelpenRowData, nummer: number }[],
) {
	const columns = [
		{ title: '#', width: 18 },
		{ title: 'Zuchtbuch-Nr.', width: 100 },
		{ title: 'R/H', width: 28 },
		{ title: 'Name', width: 120 },
		{ title: 'Farbe', width: 40 },
		{ title: 'Chipnummer', width: 105 },
		{ title: 'Gechippt', width: 56 },
		{ title: 'Verstorben', width: 56 },
	]
	let x = MARGIN_X
	columns.forEach((column) => {
		pen.page.drawText(column.title, {
			x,
			y: pen.y - 8,
			size: 6.5,
			font: pen.bold,
			color: MUTED,
		})
		x += column.width
	})
	pen.y -= 12
	pen.page.drawLine({
		start: { x: MARGIN_X, y: pen.y },
		end: { x: MARGIN_X + INNER_W, y: pen.y },
		thickness: 0.4,
		color: RULE,
	})
	pen.y -= 3

	if (welpen.length === 0) {
		pen.page.drawText('Keine Welpen erfasst.', {
			x: MARGIN_X,
			y: pen.y - 9,
			size: 8,
			font: pen.font,
			color: MUTED,
		})
		pen.y -= 16
		return
	}

	welpen.forEach(({ welpe, nummer }) => {
		const values = [
			String(nummer),
			welpe.zuchtbuchNr,
			welpe.geschlecht || welpe.rh,
			welpe.name,
			welpe.farbe,
			welpe.chipNr,
			formatDateDe(welpe.gechiptAm),
			formatDateDe(welpe.verstorbenAm),
		]
		let cellX = MARGIN_X
		values.forEach((value, cellIndex) => {
			pen.page.drawText(
				clipText(pen.font, value || '—', 7.5, columns[cellIndex].width - 4),
				{
					x: cellX,
					y: pen.y - 8,
					size: 7.5,
					font: pen.font,
					color: INK,
				},
			)
			cellX += columns[cellIndex].width
		})
		pen.y -= 11
	})
	pen.y -= 6
}

function triggerPdfDownload(bytes: Uint8Array, filename: string) {
	const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename.replace(/[\\/:*?"<>|]+/g, '-')
	link.click()
	URL.revokeObjectURL(url)
}

export async function downloadWurfabnahmePdf(
	formData: WurfabnahmeFormData,
	deletedIds?: ReadonlySet<string>,
): Promise<void> {
	const bytes = await buildWurfabnahmePdf(formData, deletedIds)
	const zwinger = formData.stammblatt.zwingername.trim() || 'Wurfabnahme'
	const datum = formatDateDe(formData.stammblatt.datum) || 'Protokoll'
	triggerPdfDownload(bytes, `Wurfabnahmeprotokoll ${zwinger} ${datum}.pdf`)
}

export async function downloadWelpenkaeuferPdf(
	formData: WurfabnahmeFormData,
	buyerId: string,
	deletedIds?: ReadonlySet<string>,
): Promise<void> {
	const buyers = formData.welpenkaeufer ?? []
	const buyerIndex = buyers.findIndex((buyer) => buyer.id === buyerId)
	const buyer = buyers[buyerIndex]
	const bytes = await buildWelpenkaeuferPdf(formData, buyerId, deletedIds)
	const name = buyer
		? buyerName(buyer) || `Welpenkäufer ${buyerIndex + 1}`
		: 'Welpenkäufer'
	const zwinger = formData.stammblatt.zwingername.trim()
	const filename = [name, zwinger, 'Welpenkäufer'].filter(Boolean).join(' ')
	triggerPdfDownload(bytes, `${filename}.pdf`)
}
