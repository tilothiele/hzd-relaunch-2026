import type { WurfabnahmeFormData } from '@/types/wurfabnahme-form'

export function collectNamedFields(
	root: HTMLElement,
): Record<string, string | boolean> {
	const fields: Record<string, string | boolean> = {}

	root.querySelectorAll('input[name], textarea[name], select[name]').forEach(
		(node) => {
			const el = node as HTMLInputElement | HTMLTextAreaElement

			if (el instanceof HTMLInputElement && el.type === 'radio') {
				if (el.checked) {
					fields[el.name] = el.value
				}
				return
			}

			if (el instanceof HTMLInputElement && el.type === 'checkbox') {
				fields[el.name] = el.checked
				return
			}

			fields[el.name] = el.value
		},
	)

	return fields
}

export function applyNamedFields(
	root: HTMLElement,
	fields: Record<string, string | boolean>,
): void {
	Object.entries(fields).forEach(([name, value]) => {
		if (typeof value === 'boolean') {
			const checkbox = root.querySelector(
				`input[name="${cssEscape(name)}"][type="checkbox"]`,
			) as HTMLInputElement | null
			if (checkbox) {
				checkbox.checked = value
			}
			return
		}

		const radio = root.querySelector(
			`input[name="${cssEscape(name)}"][value="${cssEscape(String(value))}"]`,
		) as HTMLInputElement | null
		if (radio) {
			radio.checked = true
			return
		}

		const input = root.querySelector(
			`[name="${cssEscape(name)}"]`,
		) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
		if (input) {
			input.value = String(value)
		}
	})
}

export function mergeFormDataFromDom(
	formData: WurfabnahmeFormData,
	root: HTMLElement,
): WurfabnahmeFormData {
	return {
		...formData,
	}
}

function cssEscape(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
