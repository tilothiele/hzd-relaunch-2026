'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  REGIONALGRUPPEN,
  validateSepaMandatFormData,
  type SepaMandatErrors,
  type SepaMandatErrorKey,
} from '@/lib/sepa-mandat-validation'
import type { FinanverwaltungContact } from '@/lib/server/finanverwaltung'
import type { SepaMandatFormData, SepaMandatPerson } from '@/types/sepa-mandat-form'

/** Zuständige Finanzverwaltung für die gewählte Regionalgruppe (Strapi > HZD Settings) */
type FinanStatus = 'idle' | 'loading' | 'ok' | 'empty'

const FINAN_VORSCHAU: Array<{
  key: 'headline' | 'name' | 'street' | 'zipCity' | 'phone' | 'email1' | 'email2'
  label: string
}> = [
  { key: 'headline', label: 'Headline' },
  { key: 'name', label: 'Name' },
  { key: 'street', label: 'Street' },
  { key: 'zipCity', label: 'ZipCity' },
  { key: 'phone', label: 'Phone' },
  { key: 'email1', label: 'Email1' },
  { key: 'email2', label: 'Email2' },
]

const leerePerson: SepaMandatPerson = {
  vorname: '',
  nachname: '',
  strasse: '',
  plz: '',
  ort: '',
}

const initialFormData: SepaMandatFormData = {
  regionalgruppe: '',
  mitglied: { ...leerePerson },
  abweichenderKontoinhaber: false,
  kontoinhaber: { ...leerePerson },
  kreditinstitut: '',
  iban: '',
  bic: '',
}

const inputClass = (hasError: boolean, mono = false) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  } ${mono ? 'font-mono' : ''}`

// Lesbare Feldbezeichnungen für die Meldung unter dem Absenden-Button
// (+ pro-Feld-Fehler). Schlüssel = Validierungs-Fehltaster.
const FELD_LABELS: Record<string, string> = {
  regionalgruppe: 'Regionalgruppe auswählen (Abschnitt 1)',
  mitgliedVorname: 'Mitglied – Vorname',
  mitgliedNachname: 'Mitglied – Name',
  mitgliedStrasse: 'Mitglied – Straße',
  mitgliedPlz: 'Mitglied – PLZ (exakt 5 Ziffern)',
  mitgliedOrt: 'Mitglied – Ort',
  kontoinhaberVorname: 'Kontoinhaber – Vorname (abweichend)',
  kontoinhaberNachname: 'Kontoinhaber – Name (abweichend)',
  kontoinhaberStrasse: 'Kontoinhaber – Straße (abweichend)',
  kontoinhaberPlz: 'Kontoinhaber – PLZ (abweichend)',
  kontoinhaberOrt: 'Kontoinhaber – Ort (abweichend)',
  iban: 'IBAN',
  bic: 'BIC',
  kreditinstitut: 'Kreditinstitut',
}

/**
 * Platzhalter der DOCX-Vorlage (für den Hilfetext unter dem Button).
 * Die Namen entsprechen exakt den Schlüsseln in
 * src/services/sepa-mandat-pdf-gotenberg.ts (buildSepaMandatModel).
 */
const VORLAGE_PLATZHALTER: Array<{
  pl: string
  wert: string
  hinweis?: string
}> = [
  {
    pl: 'Headline',
    wert: 'Überschrift der zuständigen Finanzverwaltung',
    hinweis: 'HZD Settings, Kontakt der gewählten Regionalgruppe.',
  },
  { pl: 'Name', wert: 'Name der zuständigen Finanzverwaltung' },
  { pl: 'Street', wert: 'Straße der zuständigen Finanzverwaltung' },
  { pl: 'ZipCity', wert: 'PLZ und Ort der zuständigen Finanzverwaltung' },
  { pl: 'Phone', wert: 'Telefon der zuständigen Finanzverwaltung' },
  { pl: 'Email1', wert: 'Erste E-Mail der zuständigen Finanzverwaltung' },
  { pl: 'Email2', wert: 'Zweite E-Mail der zuständigen Finanzverwaltung' },
  {
    pl: 'glaeubiger_info',
    wert: 'Gläubiger-Identifikationsnummer und Mandatsreferenz',
    hinweis: 'Kommt aus HZD Settings. Ohne hinterlegte Nummer bleibt nur der Hinweis auf die Mitgliedsnummer.',
  },
  { pl: 'mitglied_vorname', wert: 'Mitglied – Vorname' },
  { pl: 'mitglied_name', wert: 'Mitglied – Name' },
  { pl: 'mitglied_strasse', wert: 'Mitglied – Straße' },
  { pl: 'mitglied_plz', wert: 'Mitglied – PLZ' },
  { pl: 'mitglied_ort', wert: 'Mitglied – Ort' },
  {
    pl: 'kontoinhaber_vorname',
    wert: 'Kontoinhaber – Vorname',
    hinweis: 'Ohne abweichenden Kontoinhaber werden die Mitglied-Daten eingesetzt.',
  },
  { pl: 'kontoinhaber_name', wert: 'Kontoinhaber – Name' },
  { pl: 'kontoinhaber_strasse', wert: 'Kontoinhaber – Straße' },
  { pl: 'kontoinhaber_plz', wert: 'Kontoinhaber – PLZ' },
  { pl: 'kontoinhaber_ort', wert: 'Kontoinhaber – Ort' },
  { pl: 'iban', wert: 'IBAN' },
  {
    pl: 'bic',
    wert: 'BIC',
    hinweis: 'Optional. Bleibt leer, wenn kein BIC eingegeben wurde.',
  },
  { pl: 'kreditinstitut', wert: 'Kreditinstitut' },
]

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

export default function SepaMandatForm() {
  const [formData, setFormData] = useState<SepaMandatFormData>(initialFormData)
  const [errors, setErrors] = useState<SepaMandatErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [finanContact, setFinanContact] = useState<FinanverwaltungContact | null>(null)
  const [finanStatus, setFinanStatus] = useState<FinanStatus>('idle')
  // Gläubiger-Identifikationsnummer (Strapi > HZD Settings); null = noch nicht geladen
  const [glaeubigerId, setGlaeubigerId] = useState<string | null>(null)
  const [kopierterPlatzhalter, setKopierterPlatzhalter] = useState<string | null>(null)

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

  // Gläubiger-Identifikationsnummer aus dem Strapi-Backend laden
  useEffect(() => {
    let cancelled = false
    fetch('/api/sepa-mandat/glaeubiger-id')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return
        const wert = payload?.glaeubigerId
        if (typeof wert === 'string' && wert.trim()) {
          setGlaeubigerId(wert.trim())
        }
      })
      .catch(() => {
        /* Backend nicht erreichbar → bleibt leer */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Sende-Adresse der zuständigen Finanzverwaltung aus dem Strapi-Backend laden
  useEffect(() => {
    const region = formData.regionalgruppe
    if (region === '') {
      setFinanContact(null)
      setFinanStatus('idle')
      return
    }
    let cancelled = false
    setFinanStatus('loading')
    fetch(`/api/sepa-mandat/finanverwaltung?region=${encodeURIComponent(region)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return
        const contact = payload?.contact as FinanverwaltungContact | null | undefined
        const hatInhalt = Boolean(
          contact &&
            FINAN_VORSCHAU.some(({ key }) => {
              const wert = contact[key]
              return typeof wert === 'string' && wert.trim() !== ''
            }),
        )
        setFinanContact(hatInhalt && contact ? contact : null)
        setFinanStatus(hatInhalt ? 'ok' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setFinanContact(null)
        setFinanStatus('empty')
      })
    return () => {
      cancelled = true
    }
  }, [formData.regionalgruppe])

  const { isValid: isFormValid, errors: validierungsfehler } = validateSepaMandatFormData(formData)

  // Fehlende bzw. ungültige Pflichtfelder – für den Hinweis unter dem Absenden-Button
  const fehlendeFelder = Object.keys(validierungsfehler)
    .filter((feld) => feld !== 'bic')
    .map((feld) => FELD_LABELS[feld] ?? feld)

  // Auto-hide Toast nach 6 Sekunden
  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  /** Validierungs-Fehltaster für ein Eingabefeld (auch "person.feld") */
  const errKey = (name: string): SepaMandatErrorKey | string => {
    if (name.includes('.')) {
      const [s, k] = name.split('.') as [string, string]
      return `${s}${k.charAt(0).toUpperCase()}${k.slice(1)}`
    }
    return name
  }

  const removeError = (name: string) => {
    const ek = errKey(name)
    setErrors((prev) => {
      if (!(prev[ek as SepaMandatErrorKey])) return prev
      const next = { ...prev }
      delete next[ek as SepaMandatErrorKey]
      return next
    })
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (['regionalgruppe', 'iban', 'bic', 'kreditinstitut'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else {
      const [personKey, personFeld] = name.split('.')
      const key = personKey as 'mitglied' | 'kontoinhaber'
      setFormData((prev) => ({
        ...prev,
        [key]: { ...prev[key], [personFeld]: value },
      }))
    }
    removeError(name)
  }

  /** Schalter 'Abweichender Kontoinhaber'. Ein → Felder enabled/Pflicht (vorausgefüllt aus Mitglied);
   *  aus → Felder deaktiviert (Kontoinhaber = Mitglied). */
  const onAbweichendSwitch = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setFormData((prev) => ({
      ...prev,
      abweichenderKontoinhaber: checked,
      kontoinhaber: checked ? { ...prev.mitglied } : { ...leerePerson },
    }))
    setErrors({})
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const validation = validateSepaMandatFormData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setToast(null)

    try {
      const response = await fetch('/api/sepa-mandat-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        if (result?.errors && typeof result.errors === 'object') {
          setErrors(result.errors as SepaMandatErrors)
        } else {
          setToast({ message: result?.message || 'Fehler beim Erstellen des PDFs', type: 'error' })
        }
        setIsSubmitting(false)
        return
      }

      // PDF als Datei herunterladen
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'SEPA-Lastschriftmandat.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setToast({ message: 'SEPA-Lastschriftmandat wurde als PDF erstellt und heruntergeladen.', type: 'success' })
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error)
      setToast({ message: 'Fehler beim Erstellen des PDFs. Bitte versuchen Sie es erneut.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- wiederverwendbares Eingabefeld ---------- */
  const feld = (
    name: string,
    label: string,
    value: string,
    opts: { hint?: string; disabled?: boolean; mono?: boolean; placeholder?: string; span?: boolean; plz?: boolean } = {},
  ) => {
    const ek = errKey(name)
    const error = errors[ek as SepaMandatErrorKey]
    return (
      <div className={`space-y-3 ${opts.span ? 'md:col-span-2' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {opts.hint ? <span className="font-normal text-gray-500"> {opts.hint}</span> : null}
        </label>
        <input
          name={name}
          value={value}
          placeholder={opts.placeholder}
          disabled={opts.disabled}
          maxLength={opts.plz ? 5 : undefined}
          inputMode={opts.plz ? 'numeric' : undefined}
          onChange={onInput}
          className={`${inputClass(!!error, opts.mono)} ${opts.disabled ? 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed' : ''}`}
          data-error={!!error}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    )
  }

  const m = formData.mitglied
  const k = formData.kontoinhaber
  const abweichend = formData.abweichenderKontoinhaber

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
              SEPA-Lastschriftmandat
            </h1>
            <p className="text-xl text-blue-600 font-semibold">
              Hovawart Zuchtgemeinschaft Deutschland e. V.
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-12">

            {/* ---- Abschnitt 1: Regionalgruppe ---- */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Zuständige Regionalgruppe</h2>
              </div>

              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Wählen Sie die für Sie zuständige Regionalgruppe. Die Adresse der zuständigen
                  Geschäftsstelle wird oben links im PDF ausgegeben – senden Sie das unterschriebene
                  SEPA-Lastschriftmandat an diese Adresse.
                </p>
              </div>

              <div className="space-y-3 max-w-md">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Zuständige Regionalgruppe *
                  </label>
                  <select
                    name="regionalgruppe"
                    value={formData.regionalgruppe}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      setFormData((prev) => ({ ...prev, regionalgruppe: e.target.value }))
                      removeError('regionalgruppe')
                    }}
                    className={inputClass(!!errors.regionalgruppe)}
                    data-error={!!errors.regionalgruppe}
                  >
                    <option value="">Bitte wählen</option>
                    {REGIONALGRUPPEN.map((gruppe) => (
                      <option key={gruppe} value={gruppe}>{gruppe}</option>
                    ))}
                  </select>
                  {errors.regionalgruppe && (
                    <p className="text-sm text-red-600 mt-1">{errors.regionalgruppe}</p>
                  )}
                </div>

                {/* Vorschau: Sende-Adresse der zuständigen Finanzverwaltung (aus HZD Settings im Strapi-Backend) */}
                {formData.regionalgruppe !== '' && (
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Sende-Adresse (erscheint oben links im PDF):
                    </p>
                    {finanStatus === 'loading' && (
                      <p className="text-sm text-gray-400">Wird geladen…</p>
                    )}
                    {finanStatus === 'ok' && finanContact && (
                      <dl className="text-sm text-gray-600 space-y-1">
                        {FINAN_VORSCHAU.map(({ key, label }) => {
                          const wert = finanContact[key]
                          if (typeof wert !== 'string' || wert.trim() === '') return null
                          return (
                            <div key={key} className="grid grid-cols-[7rem_1fr] gap-2">
                              <dt className="text-gray-500">{label}</dt>
                              <dd className={key === 'headline' ? 'font-semibold text-gray-800' : ''}>
                                {wert}
                              </dd>
                            </div>
                          )
                        })}
                      </dl>
                    )}
                    {finanStatus === 'empty' && (
                      <p className="text-sm text-gray-400">
                        Keine Adresse für diese Regionalgruppe hinterlegt.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ---- Abschnitt 2: Mitglied ---- */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mitglied</h2>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Angaben zu Ihrem Mitglied. Dieser Block erscheint im PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feld('mitglied.vorname', 'Vorname *', m.vorname, { placeholder: 'Vorname des Mitglieds' })}
                {feld('mitglied.nachname', 'Name *', m.nachname, { placeholder: 'Nachname' })}
                {feld('mitglied.strasse', 'Straße *', m.strasse, { placeholder: 'Musterstraße 123', span: true })}
                {feld('mitglied.plz', 'PLZ *', m.plz, { placeholder: '20095', plz: true })}
                {feld('mitglied.ort', 'Ort *', m.ort, { placeholder: 'Hamburg' })}
              </div>
            </div>

            {/* ---- Abschnitt 3: SEPA-Lastschriftmandat / Kontoinhaber ---- */}
            <div className="pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900">SEPA-Lastschriftmandat</h2>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600">
                  Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. Zugleich weise ich
                  mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen.
                  <br />
                  Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen.
                  <br />
                  Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.
                  <br />
                  Gläubiger-Identifikationsnummer: {glaeubigerId ?? '—'}. Mandatsreferenz ist die Mitgliedsnummer.
                </p>
              </div>

              {/* ===== Kontoinhaber ===== */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Kontoinhaber</h3>
                    <p className="text-sm text-gray-600">
                      Standardmäßig ist der Kontoinhaber das <span className="font-medium">Mitglied</span> selbst
                      (Daten aus Abschnitt 2).
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={abweichend}
                      onChange={onAbweichendSwitch}
                      className="w-5 h-5 accent-orange-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Abweichender Kontoinhaber
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feld(
                    'kontoinhaber.vorname',
                    'Vorname *',
                    k.vorname,
                    {
                      disabled: !abweichend,
                      placeholder: abweichend ? 'Vorname des Kontoinhabers' : '=',
                    },
                  )}
                  {feld(
                    'kontoinhaber.nachname',
                    'Name *',
                    k.nachname,
                    { disabled: !abweichend, placeholder: abweichend ? 'Nachname' : '=' },
                  )}
                  {feld(
                    'kontoinhaber.strasse',
                    'Straße *',
                    k.strasse,
                    { disabled: !abweichend, span: true, placeholder: abweichend ? 'Musterstraße 123' : '=' },
                  )}
                  {feld(
                    'kontoinhaber.plz',
                    'PLZ *',
                    k.plz,
                    { disabled: !abweichend, plz: true, placeholder: abweichend ? '20095' : '=' },
                  )}
                  {feld(
                    'kontoinhaber.ort',
                    'Ort *',
                    k.ort,
                    { disabled: !abweichend, placeholder: abweichend ? 'Hamburg' : '=' },
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feld('iban', 'IBAN *', formData.iban, {
                    placeholder: 'DE89 3704 0044 0532 0130 00',
                    mono: true,
                    span: true,
                  })}
                  {feld('bic', 'BIC', formData.bic, {
                    hint: '(nur bei Konten im Ausland erforderlich)',
                    mono: true,
                    placeholder: 'COBADEFFXXX',
                  })}
                  {feld('kreditinstitut', 'Kreditinstitut *', formData.kreditinstitut, {
                    placeholder: 'Name der Bank',
                  })}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-4">
              {/* Hinweis (entspricht der ehemaligen gelben Box im PDF) */}
              <div className="mx-auto max-w-2xl p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Bitte senden Sie das ausgefüllte Formular an den Finanzverwalter Ihrer
                  zuständigen Regionalgruppe. Die Sende-Adresse sehen Sie oben unter
                  Ihrer Auswahl.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg ${
                    !isFormValid || isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Wird erstellt...</span>
                    </div>
                  ) : (
                    'Als PDF herunterladen'
                  )}
                </button>
              </div>

              {/* Hinweis: was noch ausgefüllt werden muss, bis abgeschickt werden kann */}
              {!isFormValid && (
                <div className="mx-auto max-w-2xl p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Damit das Formular abgeschickt werden kann, noch ausfüllen:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                    {fehlendeFelder.map((feld) => (
                      <li key={feld}>{feld}</li>
                    ))}
                  </ul>
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
                  <strong>VorlageSepaLastschriftmandat</strong>. An den Stellen
                  in der Vorlage, an denen die eingegebenen Werte stehen sollen,
                  schreiben Sie die Platzhalter in doppelte geschwungene
                  Klammern – z. B.{' '}
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900">
                    {'{{mitglied_name}}'}
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
                    Headline, Name, Street, ZipCity, Phone, Email1 und Email2
                    kommen einzeln aus dem Kontakt der Finanzverwaltung in den
                    HZD Settings und hängen an der gewählten Regionalgruppe.
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
          <div className={`px-6 py-4 rounded-lg shadow-lg max-w-md ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}>
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
