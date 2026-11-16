'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  FELD_LABELS,
  PF_PFLICHTFELDER,
  validateKoerungAusschreibung,
  type KoerungAusschreibungErrorKey,
  type KoerungAusschreibungErrors,
} from '@/lib/koerung-ausschreibung-validation'
import type { KoerungAusschreibungFormData } from '@/types/koerung-ausschreibung-form'

const initialFormData: KoerungAusschreibungFormData = {
  platzZeile1: '',
  platzZeile2: '',
  platzZeile3: '',
  platzZeile4: '',
  koermeister: '',
  zuchtrichter: '',
  leiterZeile1: '',
  leiterZeile2: '',
  leiterZeile3: '',
  leiterZeile4: '',
  leiterZeile5: '',
  koerhelfer: '',
  datum: '',
  faelligkitGebuehr: 'spätestens am 3. Banktag nach Meldeschluss',
  // Standard = Meldeschluss (wird beim Ändern des Meldeschlusses mitgeführt,
  // solange nicht manuell geändert)
  faelligkitPapiere: '',
  faelligkitBestaetigung: '7 Tage',
  meldeschluss: '',
  kontoZeile1: '',
  kontoZeile2: '',
  kontoZeile3: '',
  einlass: '',
  beginn: '',
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  }`

/**
 * Platzhalter der DOCX-Vorlage (für den Hilfetext unter dem Button).
 * Die Namen entsprechen exakt den Schlüsseln des Platzhaltermodells in
 * src/services/koerung-ausschreibung-dokumente.ts (buildKoerungAusschreibungModel).
 */
const VORLAGE_PLATZHALTER: Array<{
  pl: string
  wert: string
  hinweis?: string
}> = [
  { pl: 'Platz_Zeile1', wert: 'Platz – Zeile 1 (z. B. Bezeichnung des Platzes)' },
  { pl: 'Platz_Zeile2', wert: 'Platz – Zeile 2 (z. B. Straße und Hausnummer)' },
  { pl: 'Platz_Zeile3', wert: 'Platz – Zeile 3 (z. B. PLZ, Ort)' },
  {
    pl: 'Platz_Zeile4',
    wert: 'Platz – Zeile 4 (z. B. Navi-Koordinaten / weitere Angabe)',
  },
  {
    pl: 'Körmeister',
    wert: 'Körmeister/in',
    hinweis: 'Alternative Schreibweise: {{Koermeister}}',
  },
  { pl: 'Zuchtrichter', wert: 'Zuchtrichter/in' },
  { pl: 'Leiter_Zeile1', wert: 'Veranstaltungsleitung – Zeile 1 (z. B. Name)' },
  {
    pl: 'Leiter_Zeile2',
    wert: 'Veranstaltungsleitung – Zeile 2 (z. B. Straße, Hausnummer)',
  },
  { pl: 'Leiter_Zeile3', wert: 'Veranstaltungsleitung – Zeile 3 (z. B. PLZ, Ort)' },
  {
    pl: 'Leiter_Zeile4',
    wert: 'Veranstaltungsleitung – Zeile 4 (z. B. Telefon)',
  },
  {
    pl: 'Leiter_Zeile5',
    wert: 'Veranstaltungsleitung – Zeile 5 (z. B. E-Mail)',
  },
  {
    pl: 'Körhelfer',
    wert: 'Körhelfer/in',
    hinweis: 'Alternative Schreibweise: {{Koerhelfer}}',
  },
  {
    pl: 'Datum',
    wert: 'Datum der Körung im Format TT.MM.JJJJ (z. B. 10.10.2026)',
  },
  {
    pl: 'Meldeschluss',
    wert: 'Datum im Format TT.MM.JJJJ (z. B. 15.12.2026)',
  },
  {
    pl: 'Faelligkit_Gebuehr',
    wert: 'Fälligkeit der Meldegebühr (Standard: „spätestens am 3. Banktag nach Meldeschluss")',
  },
  {
    pl: 'Faelligkit_Papiere',
    wert: 'Fälligkeit der Papiere (Standard: Datum des Meldeschlusses)',
  },
  {
    pl: 'Faelligkit_Bestaetigung',
    wert: 'Fälligkeit der Bestätigung (Standard: „7 Tage")',
  },
  { pl: 'Konto_Zeile1', wert: 'Konto – Zeile 1 (z. B. IBAN)' },
  { pl: 'Konto_Zeile2', wert: 'Konto – Zeile 2 (z. B. BIC)' },
  { pl: 'Konto_Zeile3', wert: 'Konto – Zeile 3 (z. B. Bank / Kontoinhaber)' },
  { pl: 'Einlass', wert: 'Uhrzeit im Format HH:mm Uhr (z. B. 08:30 Uhr)' },
  { pl: 'Beginn', wert: 'Uhrzeit im Format HH:mm Uhr (z. B. 09:00 Uhr)' },
]

interface GenerierteDoku {
  name: string
  url: string
}

interface GenerierteDokumente {
  docx: GenerierteDoku
  pdf: GenerierteDoku
  /** Zeitpunkt der letzen Generation (HUI-Anzeige: 'aktualisierte Inhalte') */
  generiert: string
}

/** Base64 (API-Antwort) → Blob-URL für den Download-Link. */
function base64ZuBlobUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64), (zeichen) =>
    zeichen.charCodeAt(0),
  )
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }))
}

/** ISO-Datum (JJJJ-MM-TT) → TT.MM.JJJJ; ungültig/leer → ''. */
function formatIsoDatum(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  return m ? `${m[3]}.${m[2]}.${m[1]}` : ''
}

/** Platzhalter (ohne Klammern) → Zwischenablage (mit Clipboard-Fallback). */
async function kopiereTextInZwischenablage(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // → Fallback unten
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

export default function KoerungAusschreibungForm() {
  const [formData, setFormData] = useState<KoerungAusschreibungFormData>(
    initialFormData,
  )
  // Feld-Fehler vom Server (bei Generierungsversuch) zusätzlich zur Live-Prüfung
  const [serverErrors, setServerErrors] =
    useState<KoerungAusschreibungErrors>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generierungsFehler, setGenerierungsFehler] = useState<string | null>(
    null,
  )
  const [toast, setToast] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)
  const [dokumente, setDokumente] = useState<GenerierteDokumente | null>(
    null,
  )
  // Platzhalter, dessen Notation gerade kopiert wurde (Feedback im Hilfetext)
  const [kopierterPlatzhalter, setKopierterPlatzhalter] = useState<
    string | null
  >(null)
  // 'Fälligkeit Papiere' ist mit dem Meldeschluss gekoppelt, solange der
  // Nutzer es nicht manuell geändert hat
  const papiereManuellRef = useRef(false)

  /** {{Platzhalter}} in die Zwischenablage kopieren + kurz bestätigen. */
  const kopierePlatzhalter = async (pl: string) => {
    const ok = await kopiereTextInZwischenablage(`{{${pl}}}`)
    if (ok) {
      setKopierterPlatzhalter(pl)
      window.setTimeout(() => {
        setKopierterPlatzhalter((v) => (v === pl ? null : v))
      }, 2000)
    }
  }

  // Ständige Validierung – Fehler werden sofort am Feld + unter dem Button angezeigt.
  const liveValidierung = validateKoerungAusschreibung(formData)
  const errors: KoerungAusschreibungErrors = {
    ...liveValidierung.errors,
    ...serverErrors,
  }
  const isFormValid = Object.keys(errors).length === 0

  // Fehlende bzw. ungültige Pflichtfelder – für den Hinweis unter dem Button
  const offeneFelder = PF_PFLICHTFELDER.filter(
    (feld) => errors[feld as KoerungAusschreibungErrorKey],
  ).map((feld) => FELD_LABELS[feld as KoerungAusschreibungErrorKey])

  // Auto-hide Toast nach 6 Sekunden
  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const feld = name as KoerungAusschreibungErrorKey

    // 'Fälligkeit Papiere': manuelle Änderung erkennen (sonst bleibt die
    // Standard-Kopplung an den Meldeschluss aktiv)
    if (name === 'faelligkitPapiere') {
      papiereManuellRef.current = value.trim() !== ''
    }

    setFormData((prev) => {
      const next = { ...prev, [feld]: value }
      // Standard 'Fälligkeit Papiere' = Meldeschluss mitführen, solange nicht
      // manuell geändert (bei leerem/ungültigem Datum → leer)
      if (name === 'meldeschluss' && !papiereManuellRef.current) {
        next.faelligkitPapiere = formatIsoDatum(value)
      }
      return next
    })
    // Server-Meldung für das korrigierte Feld wegwerfen
    setServerErrors((prev) => {
      if (prev[feld] === undefined) {
        return prev
      }
      const next = { ...prev }
      delete next[feld]
      return next
    })
    // Nach Korrektur ist der bisherige Fehlerhinweis obsolet
    setGenerierungsFehler(null)
  }

  const handleGenerieren = async (e: FormEvent) => {
    e.preventDefault()

    const validation = validateKoerungAusschreibung(formData)
    if (!validation.isValid) {
      setServerErrors(validation.errors)
      return
    }

    setIsGenerating(true)
    setGenerierungsFehler(null)
    setToast(null)

    try {
      const response = await fetch('/api/koerung-ausschreibung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      })

      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        message?: string
        errors?: KoerungAusschreibungErrors
        dokumente?: {
          docx: { filename: string; mimeType: string; base64: string }
          pdf: { filename: string; mimeType: string; base64: string }
        }
      } | null

      if (!response.ok || !result?.dokumente) {
        if (result?.errors) {
          setServerErrors(result.errors)
        }
        setGenerierungsFehler(
          result?.message || 'Fehler bei der Dokumentgenerierung',
        )
        return
      }

      const neueDokumente: GenerierteDokumente = {
        docx: {
          name: result.dokumente.docx.filename,
          url: base64ZuBlobUrl(
            result.dokumente.docx.base64,
            result.dokumente.docx.mimeType,
          ),
        },
        pdf: {
          name: result.dokumente.pdf.filename,
          url: base64ZuBlobUrl(
            result.dokumente.pdf.base64,
            result.dokumente.pdf.mimeType,
          ),
        },
        generiert: new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }

      // Vorherige Object-URLs nicht im Speicher halten (Speicherplatz)
      setDokumente((vorher) => {
        if (vorher) {
          URL.revokeObjectURL(vorher.docx.url)
          URL.revokeObjectURL(vorher.pdf.url)
        }
        return neueDokumente
      })

      setToast({
        message:
          'Dokumente wurden generiert – die Download-Links zeigen die aktuel-lsten Inhalte.',
        type: 'success',
      })
    } catch (error) {
      console.error('Fehler bei der Dokumentgenerierung:', error)
      setGenerierungsFehler(
        'Fehler bei der Dokumentgenerierung. Bitte versuchen Sie es erneut.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  /* ---------- wiederverwendbares Eingabefeld ---------- */
  const feld = (
    name: KoerungAusschreibungErrorKey,
    label: string,
    opts: {
      type?: 'text' | 'date' | 'time'
      hint?: string
      placeholder?: string
      span?: boolean
    } = {},
  ) => {
    const error = errors[name]
    return (
      <div className={`space-y-3 ${opts.span ? 'md:col-span-2' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {opts.hint ? (
            <span className="font-normal text-gray-500"> {opts.hint}</span>
          ) : null}
        </label>
        <input
          type={opts.type ?? 'text'}
          name={name}
          value={formData[name]}
          placeholder={opts.placeholder}
          onChange={onInput}
          className={inputClass(!!error)}
          data-error={!!error}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f8f8' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex justify-center mb-6">
              <Image
                src="/hzd-logo.webp"
                alt="HZD Logo"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ausschreibung HZD-Körung
            </h1>
            <p className="text-xl text-blue-600 font-semibold">
              Hovawart Zuchtgemeinschaft Deutschland e. V.
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleGenerieren} className="p-8 space-y-12">
            <div className="flex flex-col space-y-12">
              {/* ---- Abschnitt 1: Ort & Platz ---- */}
              <div className="border-b border-gray-200 pb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Ort &amp; Platz
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Der Veranstaltungsort der Körung – wie in der
                    Ausschreibung angegeben (z. B. Platz, Straße und
                    Hausnummer, PLZ/Ort).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feld('platzZeile1', 'Platz – Zeile 1 *', {
                    placeholder: 'z. B. Sportplatz „Am Feld" / Reitplatz …',
                    span: true,
                  })}
                  {feld('platzZeile2', 'Platz – Zeile 2', {
                    placeholder: 'z. B. Straße und Hausnummer oder andere Ortsangabe',
                    span: true,
                  })}
                  {feld('platzZeile3', 'Platz – Zeile 3', {
                    placeholder: 'z. B. PLZ, Ort',
                    span: true,
                  })}
                  {feld('platzZeile4', 'Platz – Zeile 4', {
                    placeholder: 'z. B. Navi-Koordinaten oder weitere Angabe',
                    span: true,
                  })}
                </div>
              </div>

              {/* ---- Abschnitt 2: Körung & Leitung ---- */}
              <div className="border-b border-gray-200 pb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Körung &amp; Leitung
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Funktionsträger und Veranstal-tungsleitung der Körung –
                    wie in der Ausschreibung genannt.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feld('koermeister', 'Körmeister/in *', {
                    placeholder: 'Vor- und Nachname',
                  })}
                  {feld('zuchtrichter', 'Zuchtrichter/in *', {
                    placeholder: 'Vor- und Nachname',
                  })}
                  {feld('koerhelfer', 'Körhelfer/in *', {
                    placeholder: 'Vor- und Nachname',
                  })}
                  {feld('leiterZeile1', 'Veranstaltungsleitung – Zeile 1 *', {
                    placeholder: 'z. B. Name',
                  })}
                  {feld('leiterZeile2', 'Veranstaltungsleitung – Zeile 2', {
                    placeholder: 'z. B. Straße und Hausnummer',
                  })}
                  {feld('leiterZeile3', 'Veranstaltungsleitung – Zeile 3', {
                    placeholder: 'z. B. PLZ, Ort',
                  })}
                  {feld('leiterZeile4', 'Veranstaltungsleitung – Zeile 4', {
                    placeholder: 'z. B. Telefon',
                  })}
                  {feld('leiterZeile5', 'Veranstaltungsleitung – Zeile 5', {
                    placeholder: 'z. B. E-Mail',
                  })}
                </div>
              </div>

              {/* ---- Abschnitt 3: Termine ---- */}
              <div className="border-b border-gray-200 pb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Termine</h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Körungs-Termin, Meldeschluss, Fälligkeiten sowie Einlass
                    und Beginn der Veranstaltung.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {feld('datum', 'Datum *', {
                    type: 'date',
                    hint: '(Körung)',
                  })}
                  {feld('meldeschluss', 'Meldeschluss *', { type: 'date' })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {feld('einlass', 'Einlass *', { type: 'time' })}
                  {feld('beginn', 'Beginn *', { type: 'time' })}
                </div>

                <div className="pb-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Fälligkeiten (mit Standardwerten vorbelegt – bitte prüfen
                    bzw. anpassen):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {feld('faelligkitGebuehr', 'Fälligkeit Gebühr', {
                      placeholder: 'spätestens am 3. Banktag nach Meldeschluss',
                    })}
                    {feld('faelligkitPapiere', 'Fälligkeit Papiere', {
                      hint: '(Standard: Meldeschluss)',
                      placeholder: 'Meldeschluss',
                    })}
                    {feld('faelligkitBestaetigung', 'Fälligkeit Bestätigung', {
                      placeholder: '7 Tage',
                    })}
                  </div>
                </div>
              </div>

              {/* ---- Abschnitt 4: Konto / Bankverbindung ---- */}
              <div className="pb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    4
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Konto / Bankverbindung
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Bankverbindung für die Meldegebühr (z. B. IBAN, BIC,
                    Bank/Kontoinhaber) – wie in der Ausschreibung angegeben.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feld('kontoZeile1', 'Konto – Zeile 1 *', {
                    placeholder: 'z. B. IBAN: DE89 …',
                    span: true,
                  })}
                  {feld('kontoZeile2', 'Konto – Zeile 2', {
                    placeholder: 'z. B. BIC: …',
                    span: true,
                  })}
                  {feld('kontoZeile3', 'Konto – Zeile 3', {
                    placeholder: 'z. B. Name der Bank / Kontoinhaber',
                    span: true,
                  })}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-4">
              <div className="mx-auto max-w-2xl p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Alle Felder können jederzeit geändert werden. Jeder Klick auf
                  „Generiere Dokument(e)" erzeugt DOCX und PDF mit den
                  aktuellen Feldinhalten.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!isFormValid || isGenerating}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg ${
                    !isFormValid || isGenerating
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 hover:shadow-xl'
                  }`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Wird generiert…</span>
                    </div>
                  ) : (
                    'Generiere Dokument(e)'
                  )}
                </button>
              </div>

              {/* Fehlermeldung unter dem Button (z. B. Generator-/Vorlagenfehler) */}
              {generierungsFehler && (
                <div className="mx-auto max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    {generierungsFehler}
                  </p>
                </div>
              )}

              {/* Hinweis: was noch ausgefüllt/berichtigt werden muss */}
              {!isFormValid && (
                <div className="mx-auto max-w-2xl p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Damit die Dokumente generiert werden können, bitte ausfüllen
                    oder berichtigen:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                    {offeneFelder.map((feld) => (
                      <li key={feld}>{feld}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Download-Links der generierten Dokumente */}
              {dokumente && (
                <div className="mx-auto max-w-2xl p-5 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-green-800">
                    Dokumente sind bereit (generiert um {dokumente.generiert}
                    Uhr) – bei ge-änderten Feldern einfach erneut generieren:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={dokumente.docx.url}
                      download={dokumente.docx.name}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      {dokumente.docx.name} (DOCX) herunterladen
                    </a>
                    <a
                      href={dokumente.pdf.url}
                      download={dokumente.pdf.name}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors"
                    >
                      {dokumente.pdf.name} (PDF) herunterladen
                    </a>
                  </div>
                </div>
              )}

              {/* Hilfetext: Gestaltung der Vorlagendatei + Platzhalterliste */}
              <div className="mx-auto max-w-3xl p-5 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-base font-semibold text-blue-900 mb-3">
                  So wird die Vorlagendatei gestaltet
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Die Vorlage ist eine Word-Datei (DOCX), hinterlegt im
                  Strapi-Backend unter <strong>PWA Settings</strong> →{' '}
                  <strong>VorlageAusschreibungKoerung</strong>. An den Stellen
                  in der Vorlage, an denen die eingegebenen Werte stehen sollen,
                  schreiben Sie die Platzhalter in doppelte geschwungene
                  Klammern – z. B.{' '}
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900">
                    {'{{Platz_Zeile1}}'}
                  </span>
                  , mit exakter Groß-/Kleinschreibung wie in der Liste unten.
                  Beim Generieren werden diese Stellen durch die
                  Formularwerte ersetzt; Layout, Formatierungen und alle
                  sonstigen Texte der Vorlage bleiben unverändert.
                </p>

                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-blue-900 border-b border-blue-200">
                      <th className="text-left py-2 pr-3 font-semibold">
                        Platzhalter in der Vorlage
                      </th>
                      <th className="text-left py-2 font-semibold">
                        Wird ersetzt durch
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {VORLAGE_PLATZHALTER.map(({ pl, wert, hinweis }) => (
                      <tr
                        key={pl}
                        className="border-b border-blue-100 align-top"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900">
                              {'{{'}
                              {pl}
                              {'}}'}
                            </span>
                            <button
                              type="button"
                              onClick={() => kopierePlatzhalter(pl)}
                              title={`{{${pl}}} in die Zwischenablage kopieren`}
                              className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                                kopierterPlatzhalter === pl
                                  ? 'text-green-700 border-green-300 bg-green-50'
                                  : 'text-blue-700 border-blue-200 bg-white hover:bg-blue-100'
                              }`}
                            >
                              {kopierterPlatzhalter === pl
                                ? '✓ kopiert'
                                : '📋 kopieren'}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-blue-800">
                          {wert}
                          {hinweis && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              {hinweis}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>
                    Die Formularwerte werden erst eingesetzt, wenn alle
                    Pflichtfelder ausgefüllt sind.
                  </li>
                  <li>
                    Platzhalter können an beliebiger Stelle in der Vorlage
                    stehen (Kopfzeile, Tabelle, Fußzeile).
                  </li>
                  <li>
                    Für Körmeister/Körhelfer kann in der Vorlage die
                    Umlaut- oder die ASCII-Schreibweise verwendet werden – z. B.{' '}
                    <span className="font-mono text-xs">
                      {'{{Körmeister}}'}
                    </span>{' '}
                    oder{' '}
                    <span className="font-mono text-xs">
                      {'{{Koermeister}}'}
                    </span>{' '}
                    – beide werden ersetzt.
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Component */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg max-w-md ${
              toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
