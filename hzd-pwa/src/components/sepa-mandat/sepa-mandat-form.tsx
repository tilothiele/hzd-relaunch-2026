'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { REGIONALGRUPPEN, validateSepaMandatFormData, type SepaMandatErrors } from '@/lib/sepa-mandat-validation'
import type { SepaMandatFormData } from '@/types/sepa-mandat-form'

const initialFormData: SepaMandatFormData = {
  regionalgruppe: '',
  vorname: '',
  nachname: '',
  strasse: '',
  plz: '',
  ort: '',
  kreditinstitut: '',
  iban: '',
  bic: '',
}

const inputClass = (hasError: boolean, mono = false) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  } ${mono ? 'font-mono' : ''}`

export default function SepaMandatForm() {
  const [formData, setFormData] = useState<SepaMandatFormData>(initialFormData)
  const [errors, setErrors] = useState<SepaMandatErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    setIsFormValid(validateSepaMandatFormData(formData).isValid)
  }, [formData])

  // Auto-hide Toast nach 6 Sekunden
  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)
    setErrors((prev) => {
      if (!prev[name as keyof SepaMandatFormData]) {
        return prev
      }
      const next = { ...prev }
      delete next[name as keyof SepaMandatFormData]
      return next
    })
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

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f8f8' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
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

            {/* Regionalgruppe Section */}
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
                <label className="block text-sm font-medium text-gray-700">Zuständige Regionalgruppe *</label>
                <select
                  name="regionalgruppe"
                  value={formData.regionalgruppe}
                  onChange={handleChange}
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
            </div>

            {/* SEPA-Lastschriftmandat Section */}
            <div className="pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">SEPA-Lastschriftmandat</h2>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm text-gray-600">
                  Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. Zugleich weise ich
                  mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen.
                  <br />
                  Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen.
                  <br />
                  Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.
                  <br />
                  Gläubiger-Identifikationsnummer: DE79 ZZZ0 0000 5154 60. Mandatsreferenz ist die Mitgliedsnummer (wird separat mitgeteilt).
                </p>
              </div>

              {/* Kontoinhaber / Kontodaten */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Vorname *</label>
                  <input
                    name="vorname"
                    value={formData.vorname}
                    placeholder="Vorname des Kontoinhabers"
                    onChange={handleChange}
                    className={inputClass(!!errors.vorname)}
                    data-error={!!errors.vorname}
                  />
                  {errors.vorname && (
                    <p className="text-sm text-red-600 mt-1">{errors.vorname}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Nachname *</label>
                  <input
                    name="nachname"
                    value={formData.nachname}
                    placeholder="Nachname des Kontoinhabers"
                    onChange={handleChange}
                    className={inputClass(!!errors.nachname)}
                    data-error={!!errors.nachname}
                  />
                  {errors.nachname && (
                    <p className="text-sm text-red-600 mt-1">{errors.nachname}</p>
                  )}
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Straße *</label>
                  <input
                    name="strasse"
                    value={formData.strasse}
                    placeholder="Musterstraße 123"
                    onChange={handleChange}
                    className={inputClass(!!errors.strasse)}
                    data-error={!!errors.strasse}
                  />
                  {errors.strasse && (
                    <p className="text-sm text-red-600 mt-1">{errors.strasse}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">PLZ *</label>
                  <input
                    name="plz"
                    value={formData.plz}
                    placeholder="20095"
                    maxLength={5}
                    inputMode="numeric"
                    onChange={handleChange}
                    className={inputClass(!!errors.plz)}
                    data-error={!!errors.plz}
                  />
                  {errors.plz && (
                    <p className="text-sm text-red-600 mt-1">{errors.plz}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Ort *</label>
                  <input
                    name="ort"
                    value={formData.ort}
                    placeholder="Hamburg"
                    onChange={handleChange}
                    className={inputClass(!!errors.ort)}
                    data-error={!!errors.ort}
                  />
                  {errors.ort && (
                    <p className="text-sm text-red-600 mt-1">{errors.ort}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">IBAN *</label>
                  <input
                    name="iban"
                    value={formData.iban}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    onChange={handleChange}
                    className={inputClass(!!errors.iban, true)}
                    data-error={!!errors.iban}
                  />
                  {errors.iban && (
                    <p className="text-sm text-red-600 mt-1">{errors.iban}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    BIC * <span className="font-normal text-gray-500">(nur bei Konten im Ausland erforderlich)</span>
                  </label>
                  <input
                    name="bic"
                    value={formData.bic}
                    placeholder="COBADEFFXXX"
                    onChange={handleChange}
                    className={inputClass(!!errors.bic, true)}
                    data-error={!!errors.bic}
                  />
                  {errors.bic && (
                    <p className="text-sm text-red-600 mt-1">{errors.bic}</p>
                  )}
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Kreditinstitut *</label>
                  <input
                    name="kreditinstitut"
                    value={formData.kreditinstitut}
                    placeholder="Name der Bank"
                    onChange={handleChange}
                    className={inputClass(!!errors.kreditinstitut)}
                    data-error={!!errors.kreditinstitut}
                  />
                  {errors.kreditinstitut && (
                    <p className="text-sm text-red-600 mt-1">{errors.kreditinstitut}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                  'Absenden'
                )}
              </button>
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
