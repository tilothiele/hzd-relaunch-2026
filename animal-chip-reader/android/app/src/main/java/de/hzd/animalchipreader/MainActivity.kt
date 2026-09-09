package de.hzd.animalchipreader

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import de.hzd.animalchipreader.nfc.NfcReaderController
import de.hzd.animalchipreader.nfc.TagDecoder
import de.hzd.animalchipreader.ui.AnimalChipApp
import de.hzd.animalchipreader.ui.theme.AnimalChipTheme

class MainActivity : ComponentActivity() {
	private val viewModel: ScanViewModel by viewModels()
	private lateinit var nfc: NfcReaderController

	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		enableEdgeToEdge()
		nfc = NfcReaderController(
			activity = this,
			onTag = { tag ->
				val scan = TagDecoder.decode(tag)
				runOnUiThread { viewModel.onScan(scan) }
			},
			onStatus = { available, enabled ->
				runOnUiThread { viewModel.onNfcStatus(available, enabled) }
			},
		)
		nfc.handleIntent(intent)
		setContent {
			AnimalChipTheme {
				val state by viewModel.uiState.collectAsStateWithLifecycle()
				val history by viewModel.history.collectAsStateWithLifecycle()
				AnimalChipApp(
					state = state,
					history = history,
					onSelectScan = viewModel::selectScan,
					onClearHistory = viewModel::clearHistory,
					onResultOpened = viewModel::consumeOpenResult,
				)
			}
		}
	}

	override fun onNewIntent(intent: Intent) {
		super.onNewIntent(intent)
		setIntent(intent)
		nfc.handleIntent(intent)
	}

	override fun onResume() {
		super.onResume()
		nfc.enable()
		viewModel.onListening(true)
	}

	override fun onPause() {
		nfc.disable()
		viewModel.onListening(false)
		super.onPause()
	}
}
