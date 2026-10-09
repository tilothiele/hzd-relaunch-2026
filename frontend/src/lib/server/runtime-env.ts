/**
 * Liest eine Env-Variable zur Laufzeit.
 * Statisches `process.env.NEXT_PUBLIC_*` würde Next beim Build ersetzen.
 */
export function readRuntimeEnv (name: string): string | undefined {
	const value = process.env[name]
	if (typeof value !== 'string') {
		return undefined
	}

	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : undefined
}
