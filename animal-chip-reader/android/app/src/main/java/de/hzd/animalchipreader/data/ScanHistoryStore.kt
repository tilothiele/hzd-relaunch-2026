package de.hzd.animalchipreader.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.scanHistoryStore by preferencesDataStore(name = "scan_history")

class ScanHistoryStore(private val context: Context) {
	private val json = Json { ignoreUnknownKeys = true }
	private val key = stringPreferencesKey("scans")

	val scans: Flow<List<ChipScan>> = context.scanHistoryStore.data.map { prefs ->
		val raw = prefs[key] ?: return@map emptyList()
		runCatching { json.decodeFromString<List<ChipScan>>(raw) }.getOrDefault(emptyList())
	}

	suspend fun add(scan: ChipScan) {
		context.scanHistoryStore.edit { prefs ->
			val current = prefs[key]
				?.let { runCatching { json.decodeFromString<List<ChipScan>>(it) }.getOrDefault(emptyList()) }
				?: emptyList()
			val next = (listOf(scan) + current.filterNot { it.uidHex == scan.uidHex && it.compactAnimalId == scan.compactAnimalId })
				.take(MAX_ITEMS)
			prefs[key] = json.encodeToString(next)
		}
	}

	suspend fun clear() {
		context.scanHistoryStore.edit { it.remove(key) }
	}

	companion object {
		private const val MAX_ITEMS = 100
	}
}
