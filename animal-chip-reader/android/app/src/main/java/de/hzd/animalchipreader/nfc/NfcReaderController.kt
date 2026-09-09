package de.hzd.animalchipreader.nfc

import android.app.Activity
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Build
import android.os.Bundle

class NfcReaderController(
	private val activity: Activity,
	private val onTag: (Tag) -> Unit,
	private val onStatus: (available: Boolean, enabled: Boolean) -> Unit,
) {
	private val adapter: NfcAdapter? = NfcAdapter.getDefaultAdapter(activity)

	fun refreshStatus() {
		onStatus(adapter != null, adapter?.isEnabled == true)
	}

	fun enable() {
		refreshStatus()
		val nfc = adapter ?: return
		if (!nfc.isEnabled) return
		nfc.enableReaderMode(
			activity,
			{ tag -> onTag(tag) },
			READER_FLAGS,
			Bundle().apply {
				putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250)
			},
		)
	}

	fun disable() {
		try {
			adapter?.disableReaderMode(activity)
		} catch (_: Exception) {
		}
	}

	fun handleIntent(intent: Intent?) {
		val tag = intent.tagExtra() ?: return
		onTag(tag)
	}

	companion object {
		const val READER_FLAGS =
			NfcAdapter.FLAG_READER_NFC_A or
				NfcAdapter.FLAG_READER_NFC_B or
				NfcAdapter.FLAG_READER_NFC_F or
				NfcAdapter.FLAG_READER_NFC_V or
				NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
	}
}

fun Intent?.tagExtra(): Tag? {
	this ?: return null
	return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
		getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
	} else {
		@Suppress("DEPRECATION")
		getParcelableExtra(NfcAdapter.EXTRA_TAG)
	}
}
