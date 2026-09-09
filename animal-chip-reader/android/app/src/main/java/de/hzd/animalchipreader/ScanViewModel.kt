package de.hzd.animalchipreader

import android.app.Application
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import de.hzd.animalchipreader.data.ChipScan
import de.hzd.animalchipreader.data.ScanHistoryStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ScanUiState(
	val nfcAvailable: Boolean = false,
	val nfcEnabled: Boolean = false,
	val isListening: Boolean = false,
	val lastScan: ChipScan? = null,
	val openResult: Boolean = false,
	val statusMessage: String? = null,
)

class ScanViewModel(application: Application) : AndroidViewModel(application) {
	private val historyStore = ScanHistoryStore(application)

	private val _uiState = MutableStateFlow(ScanUiState())
	val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

	val history: StateFlow<List<ChipScan>> = historyStore.scans.stateIn(
		viewModelScope,
		SharingStarted.WhileSubscribed(5_000),
		emptyList(),
	)

	fun onNfcStatus(available: Boolean, enabled: Boolean) {
		_uiState.update {
			it.copy(
				nfcAvailable = available,
				nfcEnabled = enabled,
				isListening = available && enabled,
				statusMessage = when {
					!available -> "Dieses Gerät hat kein NFC."
					!enabled -> "Bitte NFC in den Systemeinstellungen einschalten."
					else -> null
				},
			)
		}
	}

	fun onListening(listening: Boolean) {
		_uiState.update { it.copy(isListening = listening && it.nfcAvailable && it.nfcEnabled) }
	}

	fun onScan(scan: ChipScan) {
		_uiState.update {
			it.copy(lastScan = scan, openResult = true, statusMessage = null)
		}
		viewModelScope.launch {
			historyStore.add(scan)
		}
		vibrate()
	}

	fun consumeOpenResult() {
		_uiState.update { it.copy(openResult = false) }
	}

	fun selectScan(scan: ChipScan) {
		_uiState.update { it.copy(lastScan = scan, openResult = true) }
	}

	fun clearHistory() {
		viewModelScope.launch { historyStore.clear() }
	}

	private fun vibrate() {
		val context = getApplication<Application>()
		val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
			context.getSystemService(VibratorManager::class.java)?.defaultVibrator
		} else {
			@Suppress("DEPRECATION")
			context.getSystemService(Vibrator::class.java)
		} ?: return
		vibrator.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
	}
}
