'use client'

import { useState, ChangeEvent, FormEvent, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { MEMBERSHIP_TYPES } from '@/constants/membership-types'
import { REGIONAL_GROUPS } from '@/constants/regional-groups'
import type { RegionalUnitHeader } from '@/lib/regional-unit'
import type { FinanverwaltungContact } from '@/lib/server/finanverwaltung'
import { FormData } from '@/types/formData'

interface RegionalUnitOption {
  documentId: string;
  name: string;
  header: RegionalUnitHeader;
}

/**
 * Platzhalter der DOCX-Vorlage (Hilfetext unter dem Button).
 * Die Namen entsprechen den Schlüsseln in
 * src/services/mitgliedsantrag-dokumente.ts (buildMitgliedsantragModel).
 */
const VORLAGE_PLATZHALTER: Array<{
  pl: string;
  wert: string;
  hinweis?: string;
}> = [
  {
    pl: 'Headline',
    wert: 'Name der gewählten Regionalgruppe',
    hinweis: 'RegionalUnit.Name aus der Auswahlliste oben.',
  },
  {
    pl: 'Name',
    wert: 'Name der verknüpften Ortsgruppe',
    hinweis: 'LocalCommunity.Name der gewählten RegionalUnit. Mehrere Ortsgruppen stehen untereinander.',
  },
  { pl: 'Street', wert: 'Straße der verknüpften Ortsgruppe' },
  { pl: 'ZipCity', wert: 'PLZ und Ort der verknüpften Ortsgruppe' },
  {
    pl: 'Phone',
    wert: 'Telefon der Regionalgruppe',
    hinweis: 'Zuerst CFO, sonst CEO, sonst Schriftführung.',
  },
  {
    pl: 'Email1',
    wert: 'E-Mail der Finanzverwaltung (CFO)',
  },
  {
    pl: 'Email2',
    wert: 'E-Mail der Schriftführung, sonst des CEO',
  },
  {
    pl: 'antrag_fuer',
    wert: 'Name im Antragstitel',
    hinweis: 'Name der Ortsgruppe, sonst RegionalUnit.Name.',
  },
  { pl: 'anrede', wert: 'Antragsteller – Anrede' },
  { pl: 'vorname', wert: 'Antragsteller – Vorname' },
  { pl: 'name', wert: 'Antragsteller – Name' },
  { pl: 'strasse', wert: 'Antragsteller – Straße' },
  { pl: 'plz', wert: 'Antragsteller – PLZ' },
  { pl: 'ort', wert: 'Antragsteller – Ort' },
  { pl: 'geburtsdatum', wert: 'Antragsteller – Geburtsdatum (TT.M.JJJJ)' },
  { pl: 'email', wert: 'Antragsteller – E-Mail' },
  { pl: 'telefon', wert: 'Antragsteller – Telefon' },
  {
    pl: 'mitgliedschaft_vdh',
    wert: 'Bisherige Mitgliedschaften in VDH-Verbänden oder -Vereinen',
  },
  { pl: 'hund_name', wert: 'Hund – Name' },
  { pl: 'hund_zwinger', wert: 'Hund – Zwingername' },
  { pl: 'hund_zuchtbuch', wert: 'Hund – Zuchtbuchnummer' },
  { pl: 'hund_wurfdatum', wert: 'Hund – Wurfdatum (TT.M.JJJJ)' },
  { pl: 'hund_rasse', wert: 'Hund – Rasse' },
  { pl: 'hund_versicherung', wert: 'Hund – Haftpflichtversicherung' },
  { pl: 'hund_vers_nr', wert: 'Hund – Versicherungsnummer' },
  { pl: 'hund_geschlecht', wert: 'Hund – Geschlecht' },
  { pl: 'hund_chip', wert: 'Hund – Chipnummer' },
  {
    pl: 'mitgliedschaft_label',
    wert: 'Bezeichnung der gewählten Mitgliedschaft',
    hinweis: 'Bei Kurzmitgliedschaft inklusive Von- und Bis-Datum.',
  },
  { pl: 'mitgliedschaft_zeitraum', wert: 'Zeitraum (jährlich oder monatlich)' },
  { pl: 'mitgliedschaft_preis', wert: 'Beitrag der gewählten Mitgliedschaft' },
  {
    pl: 'familien_hinweis',
    wert: 'Hinweis zur Familienmitgliedschaft',
    hinweis: 'Nur gefüllt, wenn eine Familienmitgliedschaft gewählt ist.',
  },
  {
    pl: 'glaeubiger_id',
    wert: 'Gläubiger-Identifikationsnummer',
    hinweis: 'Kommt aus HZD Settings.',
  },
  {
    pl: 'kontoinhaber',
    wert: 'Kontoinhaber',
    hinweis: 'Ohne abweichenden Kontoinhaber werden Vor- und Nachname des Antragstellers eingesetzt.',
  },
  { pl: 'anschrift', wert: 'Anschrift des Kontoinhabers (Straße, PLZ Ort)' },
  { pl: 'kreditinstitut', wert: 'Kreditinstitut' },
  { pl: 'iban', wert: 'IBAN' },
  { pl: 'bic', wert: 'BIC' },
  {
    pl: 'weitere_mitteilungen',
    wert: 'Weitere Mitteilungen',
    hinweis: 'Bleibt leer, wenn das Feld nicht ausgefüllt wurde.',
  },
];

/** Platzhalter (ohne Klammern) in die Zwischenablage kopieren. */
async function kopiereTextInZwischenablage(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback unten
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export default function AntragForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    anrede: "",
    name: "",
    vorname: "",
    geburtsdatum: "",
    strasse: "",
    plz: "",
    ort: "",
    email: "",
    telefon: "",
    mitgliedschaftVDH: "",
    hundName: "",
    hundZwinger: "",
    hundZuchtbuch: "",
    hundChip: "",
    hundWurfdatum: "",
    hundRasse: "",
    hundGeschlecht: "",
    hundVersicherung: "",
    hundVersNr: "",
    mitgliedschaft: "",
    kurzzeitVon: "",
    kurzzeitBis: "",
    kontoinhaber: "",
    sepaName: "",
    sepaIban: "",
    sepaBic: "",
    sepaKreditinstitut: "",
    weitereMitteilungen: "",
    regionalgruppe: "",
    regionalUnitId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [useAntragstellerAsKontoinhaber, setUseAntragstellerAsKontoinhaber] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [finanContact, setFinanContact] = useState<FinanverwaltungContact | null>(null);
  const [kopierterPlatzhalter, setKopierterPlatzhalter] = useState<string | null>(null);
  const [finanLoading, setFinanLoading] = useState(false);
  const [regionalUnits, setRegionalUnits] = useState<RegionalUnitOption[]>([]);
  const [regionalUnitsLoading, setRegionalUnitsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/mitgliedsantrag/regional-units')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const units = Array.isArray(payload?.units) ? payload.units : [];
        setRegionalUnits(units);
      })
      .catch(() => {
        if (!cancelled) setRegionalUnits([]);
      })
      .finally(() => {
        if (!cancelled) setRegionalUnitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRegionalUnit = regionalUnits.find(
    (unit) => unit.documentId === formData.regionalUnitId,
  ) ?? null;

  // Lädt die zuständige Finanzverwaltung (Strapi > HZD Settings) für die gewählte Regionalgruppe
  useEffect(() => {
    const region = formData.regionalgruppe;
    if (!region) {
      setFinanContact(null);
      return;
    }
    let cancelled = false;
    setFinanLoading(true);
    fetch(`/api/mitgliedsantrag/finanverwaltung?region=${encodeURIComponent(region)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled) setFinanContact(payload?.contact ?? null);
      })
      .catch(() => {
        if (!cancelled) setFinanContact(null);
      })
      .finally(() => {
        if (!cancelled) setFinanLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.regionalgruppe]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    let updatedFormData;
    if (type === "radio") {
      updatedFormData = { ...formData, mitgliedschaft: value };
    } else {
      updatedFormData = { ...formData, [name]: value };
    }

    setFormData(updatedFormData);

    // Validiere das Formular mit den aktualisierten Daten
    setTimeout(() => {
      const validationResult = validateFormWithData(updatedFormData);
//      console.log('Updated form data:', updatedFormData);
//      console.log('Validation result:', validationResult);
//      console.log('Form valid:', validationResult.isValid);
//      console.log('Error count:', Object.keys(validationResult.errors).length);
//      console.log('Errors:', validationResult.errors);
      setIsFormValid(validationResult.isValid);
    }, 100);
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseAntragstellerAsKontoinhaber(checked);

    // Wenn Checkbox aktiviert wird, leere nur das Kontoinhaber-Feld
    if (checked) {
      setFormData(prev => ({
        ...prev,
        sepaName: ""
      }));
    }
  };

  const validateFormWithData = useCallback((data: FormData): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    console.log('Validating form data:', data);

    if (!data.regionalUnitId || !data.regionalUnitId.trim()) {
      newErrors.regionalUnitId = "Bitte wählen Sie eine Regionalgruppe";
    }

    // Vereinfachte Validierung - nur die wichtigsten Felder
    if (!data.vorname || !data.vorname.trim()) {
      newErrors.vorname = "Vorname ist erforderlich";
      console.log('Vorname missing or empty');
    }
    if (!data.name || !data.name.trim()) {
      newErrors.name = "Nachname ist erforderlich";
      console.log('Name missing or empty');
    }
    if (!data.email || !data.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
      console.log('Email missing or empty');
    }
    if (!data.hundName || !data.hundName.trim()) {
      newErrors.hundName = "Name des Hundes ist erforderlich";
      console.log('Hund name missing or empty');
    }
    if (!data.mitgliedschaft || !data.mitgliedschaft.trim()) {
      newErrors.mitgliedschaft = "Bitte wählen Sie eine Mitgliedschaftsart";
      console.log('Mitgliedschaft not selected');
    }

    // SEPA-Felder validieren
    // Kontoinhaber validieren - entweder sepaName oder vorname+name
    const ermittelterKontoinhaber = useAntragstellerAsKontoinhaber
      ? `${data.vorname} ${data.name}`
      : data.sepaName;

    if (!ermittelterKontoinhaber || !ermittelterKontoinhaber.trim()) {
      newErrors.sepaName = "Kontoinhaber ist erforderlich";
      console.log('Kontoinhaber missing or empty');
    }

    // IBAN, BIC und Kreditinstitut werden immer validiert
    if (!data.sepaIban || !data.sepaIban.trim()) {
      newErrors.sepaIban = "IBAN ist erforderlich";
      console.log('SEPA IBAN missing or empty');
    }
    if (!data.sepaBic || !data.sepaBic.trim()) {
      newErrors.sepaBic = "BIC ist erforderlich";
      console.log('SEPA BIC missing or empty');
    }
    if (!data.sepaKreditinstitut || !data.sepaKreditinstitut.trim()) {
      newErrors.sepaKreditinstitut = "Kreditinstitut ist erforderlich";
      console.log('SEPA Kreditinstitut missing or empty');
    }

    console.log('Validation errors found:', Object.keys(newErrors).length);
    console.log('Errors:', newErrors);

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [useAntragstellerAsKontoinhaber]);

  // Initiale Validierung beim Laden der Komponente - nach validateFormWithData definiert
  useEffect(() => {
    const validationResult = validateFormWithData(formData);
    setIsFormValid(validationResult.isValid);
  }, [formData, validateFormWithData]);

  // Auto-hide Toast nach 5 Sekunden
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    return validateFormWithData(formData);
  };



  const kopierePlatzhalter = async (pl: string) => {
    const ok = await kopiereTextInZwischenablage(`{{${pl}}}`);
    if (ok) {
      setKopierterPlatzhalter(pl);
      window.setTimeout(() => {
        setKopierterPlatzhalter((v) => (v === pl ? null : v));
      }, 2000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationResult = validateForm();
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    const kontoinhaber = useAntragstellerAsKontoinhaber
      ? `${formData.vorname} ${formData.name}`.trim()
      : formData.sepaName.trim();

    const payload: FormData = {
      ...formData,
      kontoinhaber,
    };

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData: payload }),
      });

      if (!response.ok) {
        let message = 'Das PDF konnte nicht erstellt werden.';
        try {
          const result = await response.json();
          if (typeof result?.message === 'string' && result.message.trim()) {
            message = result.message;
          }
        } catch {
          // Antwort ohne JSON
        }
        setToast({ message, type: 'error' });
        setErrors({ general: message });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HZD-Aufnahmeantrag.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Das PDF wurde erstellt.', type: 'success' });
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error);
      const message = 'Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.';
      setToast({ message, type: 'error' });
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f8f8' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="max-w-md mx-auto mb-6 text-left">
              <label htmlFor="regionalUnitId" className="block text-sm font-medium text-gray-700 mb-2">
                Regionalgruppe *
              </label>
              <select
                id="regionalUnitId"
                name="regionalUnitId"
                value={formData.regionalUnitId || ''}
                onChange={handleChange}
                disabled={regionalUnitsLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                  errors.regionalUnitId ? 'border-red-500' : 'border-gray-300'
                }`}
                data-error={!!errors.regionalUnitId}
              >
                <option value="">
                  {regionalUnitsLoading ? 'Wird geladen…' : 'Bitte wählen'}
                </option>
                {regionalUnits.map((unit) => (
                  <option key={unit.documentId} value={unit.documentId}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.regionalUnitId && (
                <p className="text-sm text-red-600 mt-1">{errors.regionalUnitId}</p>
              )}
            </div>

            {/* Logo */}
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
              HZD Ortsgruppen-Aufnahmeantrag
            </h1>
            <p className="text-xl text-blue-600 font-semibold">
              {selectedRegionalUnit?.header.antragFuer || 'Bitte Regionalgruppe wählen'}
            </p>

            {/* Allgemeine Fehlermeldungen */}
            {errors.general && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
            {selectedRegionalUnit && (
              <div className="text-l text-blue-600 space-y-0.5">
                {selectedRegionalUnit.header.street.split('\n').filter(Boolean).map((line, index) => (
                  <p key={`street-${index}`}>{line}</p>
                ))}
                {selectedRegionalUnit.header.zipCity.split('\n').filter(Boolean).map((line, index) => (
                  <p key={`zip-${index}`}>{line}</p>
                ))}
                {selectedRegionalUnit.header.phone && (
                  <p>{selectedRegionalUnit.header.phone}</p>
                )}
                {selectedRegionalUnit.header.email1 && (
                  <p>{selectedRegionalUnit.header.email1}</p>
                )}
                {selectedRegionalUnit.header.email2 && (
                  <p>{selectedRegionalUnit.header.email2}</p>
                )}
              </div>
            )}
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-12">

            {/* Antragsteller Section */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Antragsteller</h2>
              </div>

              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Hiermit beantrage ich in Anerkennung der Satzung, Ordnungen und Beschlüsse der HZD die Mitgliedschaft in der{' '}
                  {selectedRegionalUnit?.header.antragFuer || 'Ortsgruppe'} der Hovawart
                  Zuchtgemeinschaft Deutschland e.V.. Ich gehöre keinem kynologischen Verein außerhalb des Verbandes für das Deutsche Hundewesen
                  (VDH) bzw. außerhalb der Fédération Cynologique Internationale (FCI) an. Ich bestätige, dass ich aus keinem anderen VDH-Verein
                  ausgeschlossen wurde und dass gegen mich kein Ausschlussverfahren läuft. Ich bin weder gewerbsmäßiger Hundehändler/-züchter noch
                  Hundeverkaufsvermittler.
                </p>
              </div>

              <div className="space-y-8">
                {/* 0. Zeile: Anrede */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Anrede *</label>
                    <select
                      name="anrede"
                      value={formData.anrede}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.anrede ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.anrede}
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Frau">Frau</option>
                      <option value="Herr">Herr</option>
                    </select>
                    {errors.anrede && (
                      <p className="text-sm text-red-600 mt-1">{errors.anrede}</p>
                    )}
                  </div>
                </div>

                {/* 1. Zeile: Vorname, Nachname, Geburtsdatum */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Vorname *</label>
                    <input
                      name="vorname"
                      value={formData.vorname}
                      placeholder="Ihr Vorname"
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.vorname ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.vorname}
                    />
                    {errors.vorname && (
                      <p className="text-sm text-red-600 mt-1">{errors.vorname}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Nachname *</label>
                    <input
                      name="name"
                      value={formData.name}
                      placeholder="Ihr Nachname"
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Geburtsdatum *</label>
                    <input
                      name="geburtsdatum"
                      type="date"
                      value={formData.geburtsdatum}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.geburtsdatum ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.geburtsdatum}
                    />
                    {errors.geburtsdatum && (
                      <p className="text-sm text-red-600 mt-1">{errors.geburtsdatum}</p>
                    )}
                  </div>
                </div>

                {/* 2. Zeile: Straße, PLZ, Ort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Straße *</label>
                    <input
                      name="strasse"
                      value={formData.strasse}
                      placeholder="Musterstraße 123"
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.strasse ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.plz ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.ort ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.ort}
                    />
                    {errors.ort && (
                      <p className="text-sm text-red-600 mt-1">{errors.ort}</p>
                    )}
                  </div>
                </div>

                {/* 3. Zeile: Telefon, E-Mail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Telefon *</label>
                    <input
                      name="telefon"
                      value={formData.telefon}
                      placeholder="+49 40 12345678"
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.telefon ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.telefon}
                    />
                    {errors.telefon && (
                      <p className="text-sm text-red-600 mt-1">{errors.telefon}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">E-Mail *</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      placeholder="ihre.email@beispiel.de"
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      data-error={!!errors.email}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Zeile: VDH Mitgliedschaften (vollbreite) */}
              <div className="mt-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">VDH Mitgliedschaften</label>
                  <input
                    value={formData.mitgliedschaftVDH}
                    name="mitgliedschaftVDH"
                    placeholder="Bestehende VDH Mitgliedschaften"
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Hund Section */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Hund</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    name="hundName"
                    value={formData.hundName}
                    placeholder="Name des Hundes"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundName}
                  />
                  {errors.hundName && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundName}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Zwinger</label>
                  <input
                    name="hundZwinger"
                    value={formData.hundZwinger}
                    placeholder="Zwingername"
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Zuchtbuchnummer</label>
                  <input
                    value={formData.hundZuchtbuch}
                    name="hundZuchtbuch"
                    placeholder="Zuchtbuchnummer"
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Chip-Nr. *</label>
                  <input
                    value={formData.hundChip}
                    name="hundChip"
                    placeholder="Chip-Nummer"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundChip ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundChip}
                  />
                  {errors.hundChip && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundChip}</p>
                  )}
                </div>



                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Wurfdatum *</label>
                  <input
                    value={formData.hundWurfdatum}
                    name="hundWurfdatum"
                    type="date"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundWurfdatum ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundWurfdatum}
                  />
                  {errors.hundWurfdatum && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundWurfdatum}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Rasse *</label>
                  <input
                    value={formData.hundRasse}
                    name="hundRasse"
                    placeholder="Hunderasse"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundRasse ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundRasse}
                  />
                  {errors.hundRasse && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundRasse}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Geschlecht *</label>
                  <select
                    value={formData.hundGeschlecht}
                    name="hundGeschlecht"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundGeschlecht ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundGeschlecht}
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Rüde">Rüde</option>
                    <option value="Hündin">Hündin</option>
                  </select>
                  {errors.hundGeschlecht && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundGeschlecht}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Haftpflichtversicherung *</label>
                  <input
                    value={formData.hundVersicherung}
                    name="hundVersicherung"
                    placeholder="Versicherungsgesellschaft"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundVersicherung ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundVersicherung}
                  />
                  {errors.hundVersicherung && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundVersicherung}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Versicherungsnummer *</label>
                  <input
                    value={formData.hundVersNr}
                    name="hundVersNr"
                    placeholder="Versicherungsnummer"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.hundVersNr ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.hundVersNr}
                  />
                  {errors.hundVersNr && (
                    <p className="text-sm text-red-600 mt-1">{errors.hundVersNr}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mitgliedschaft Section */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mitgliedschaft</h2>
              </div>

              <div className="space-y-6">
                {errors.mitgliedschaft && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.mitgliedschaft}</p>
                  </div>
                )}

                {/* Dynamische Mitgliedschaftsoptionen aus Konstanten */}
                {MEMBERSHIP_TYPES.map((membershipType) => (
                  <div key={membershipType.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="mitgliedschaft"
                      value={membershipType.id}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">
                        {membershipType.label}
                      </label>
                      <p className="text-sm text-gray-600">
                        {membershipType.price} {membershipType.period}
                      </p>
                      {membershipType.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {membershipType.description}
                        </p>
                      )}
                      {membershipType.requiresDateRange && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1">
                        <label className="block text-xs text-gray-600">Von (Jahr/Monat)</label>
                        <input
                          type="month"
                          name="kurzzeitVon"
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-transparent ${
                            errors.kurzzeitVon ? 'border-red-500' : 'border-gray-300'
                          }`}
                          data-error={!!errors.kurzzeitVon}
                        />
                        {errors.kurzzeitVon && (
                          <p className="text-xs text-red-600 mt-1">{errors.kurzzeitVon}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-gray-600">Bis (Jahr/Monat)</label>
                        <input
                          type="month"
                          name="kurzzeitBis"
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.kurzzeitBis ? 'border-red-500' : 'border-gray-300'
                          }`}
                          data-error={!!errors.kurzzeitBis}
                        />
                        {errors.kurzzeitBis && (
                          <p className="text-xs text-red-600 mt-1">{errors.kurzzeitBis}</p>
                        )}
                      </div>
                    </div>
                    )}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* SEPA Section */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900">SEPA-Lastschriftmandat</h2>
              </div>

              {/* Regionalgruppe & zuständige Finanzverwaltung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Regionalgruppe
                  </label>
                  <select
                    name="regionalgruppe"
                    value={formData.regionalgruppe || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Bitte wählen</option>
                    {REGIONAL_GROUPS.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Zuständige Finanzverwaltung
                  </label>
                  <div className="min-h-[3.75rem] px-4 py-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-gray-700">
                    {finanLoading && (
                      <p className="text-gray-400">Wird geladen…</p>
                    )}
                    {!finanLoading && !formData.regionalgruppe && (
                      <p className="text-gray-400">Bitte Regionalgruppe wählen.</p>
                    )}
                    {!finanLoading && formData.regionalgruppe && finanContact && (
                      <div className="space-y-0.5">
                        {finanContact.name && <p>{finanContact.name}</p>}
                        {finanContact.street && <p>{finanContact.street}</p>}
                        {finanContact.zipCity && <p>{finanContact.zipCity}</p>}
                      </div>
                    )}
                    {!finanLoading && formData.regionalgruppe && !finanContact && (
                      <p className="text-gray-400">Keine Adresse hinterlegt.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1">
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
              </div>

              {/* Checkbox für Kontoinhaber */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAntragstellerAsKontoinhaber}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Kontoinhaber ist identisch mit Antragsteller
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Kontoinhaber {!useAntragstellerAsKontoinhaber && '*'}
                  </label>
                  <input
                    name="sepaName"
                    value={useAntragstellerAsKontoinhaber ? `${formData.vorname} ${formData.name}` : formData.sepaName}
                    placeholder={useAntragstellerAsKontoinhaber ? `${formData.vorname} ${formData.name}` : "Name des Kontoinhabers"}
                    onChange={handleChange}
                    disabled={useAntragstellerAsKontoinhaber}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                      errors.sepaName ? 'border-red-500' : 'border-gray-300'
                    } ${useAntragstellerAsKontoinhaber ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    data-error={!!errors.sepaName}
                  />
                  {errors.sepaName && (
                    <p className="text-sm text-red-600 mt-1">{errors.sepaName}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Kreditinstitut *</label>
                  <input
                    name="sepaKreditinstitut"
                    value={formData.sepaKreditinstitut}
                    placeholder="Name der Bank"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                      errors.sepaKreditinstitut ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.sepaKreditinstitut}
                  />
                  {errors.sepaKreditinstitut && (
                    <p className="text-sm text-red-600 mt-1">{errors.sepaKreditinstitut}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">IBAN *</label>
                  <input
                    name="sepaIban"
                    value={formData.sepaIban}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 font-mono ${
                      errors.sepaIban ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.sepaIban}
                  />
                  {errors.sepaIban && (
                    <p className="text-sm text-red-600 mt-1">{errors.sepaIban}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">BIC *</label>
                  <input
                    name="sepaBic"
                    value={formData.sepaBic}
                    placeholder="COBADEFFXXX"
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 font-mono ${
                      errors.sepaBic ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-error={!!errors.sepaBic}
                  />
                  {errors.sepaBic && (
                    <p className="text-sm text-red-600 mt-1">{errors.sepaBic}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Abschluss Section */}
            <div className="pb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Abschluss</h2>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Hinweis:</strong> Mit „PDF erstellen“ wird der Antrag als PDF-Datei heruntergeladen.
                    Der Antrag wird erst gültig, wenn er in Papierform und unterschrieben vorliegt. Sie können den unterschriebenen Mitgliedsantrag per Post an die oben genannte Adresse schicken.
                    Alternativ können Sie zur Unterschrift bei nächster Gelegenheit im Vereinshaus in Hamburg-Billwerder vorbeikommen.
                </p>
              </div>
            </div>

            {/* Weitere Mitteilungen */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Weitere Mitteilungen
              </label>
              <textarea
                name="weitereMitteilungen"
                value={formData.weitereMitteilungen}
                onChange={handleChange}
                placeholder="Hier können Sie zusätzliche Informationen oder Mitteilungen eingeben..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Buttons */}
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
                  'PDF erstellen'
                )}
              </button>
            </div>

            <div className="mx-auto max-w-3xl p-5 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-base font-semibold text-blue-900 mb-3">
                So wird die Vorlagendatei gestaltet
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Die Vorlage ist eine Word-Datei (DOCX), hinterlegt im
                Strapi-Backend unter <strong>PWA Settings</strong> →{' '}
                <strong>Mitgliedsantrag_OG</strong>. An den Stellen
                in der Vorlage, an denen die eingegebenen Werte stehen sollen,
                schreiben Sie die Platzhalter in doppelte geschwungene
                Klammern – z. B.{' '}
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900">
                  {'{{name}}'}
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
                  Headline, Name, Street, ZipCity, Phone, Email1, Email2 und
                  antrag_fuer kommen aus der oben gewählten RegionalUnit.
                  Name (groß) ist die Ortsgruppe, name (klein) der Antragsteller.
                </li>
                <li>
                  Es wird nur das PDF erzeugt. Der Antrag wird nicht gespeichert
                  und es wird keine E-Mail versendet.
                </li>
              </ul>
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
  );
}
