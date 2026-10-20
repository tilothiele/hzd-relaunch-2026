import { readRuntimeEnv } from './runtime-env'

export function isSiteSearchConfigured(): boolean {
	return Boolean(readRuntimeEnv('MEILI_HOST'))
}
