export function calculateAge(dateOfBirth: string | null | undefined): string | null {
    if (!dateOfBirth) {
        return null
    }

    try {
        const birthDate = new Date(dateOfBirth)
        const today = new Date()

        // Prüfe, ob das Datum gültig ist
        if (isNaN(birthDate.getTime())) {
            return null
        }

        // Berechne die Differenz
        let years = today.getFullYear() - birthDate.getFullYear()
        let months = today.getMonth() - birthDate.getMonth()

        // Korrigiere, falls der Geburtstag noch nicht in diesem Monat war
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--
            months += 12
        }

        // Formatiere das Ergebnis
        if (years === 0 && months === 0) {
            return '(0 Jahre 0 Monate)'
        }

        const yearsText = years === 1 ? 'Jahr' : 'Jahre'
        const monthsText = months === 1 ? 'Monat' : 'Monate'

        if (years === 0) {
            return `(${months} ${monthsText} alt)`
        }

        if (months === 0) {
            return `(${years} ${yearsText})`
        }

        return `(${years} ${yearsText} ${months} ${monthsText} alt)`
    } catch {
        return null
    }
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return '-'
    }

    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
    } catch {
        return dateString
    }
}
