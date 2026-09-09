package de.hzd.animalchipreader.ui.result

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.Nfc
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import de.hzd.animalchipreader.data.ChipScan
import de.hzd.animalchipreader.ui.theme.Putty500
import de.hzd.animalchipreader.ui.theme.SuccessGreen
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ResultScreen(scan: ChipScan, onScanAgain: () -> Unit) {
	val context = LocalContext.current
	val snackbar = remember { SnackbarHostState() }
	val scope = rememberCoroutineScope()
	val shareText = buildShareText(scan)

	Column(modifier = Modifier.fillMaxSize()) {
		Column(
			modifier = Modifier
				.weight(1f)
				.verticalScroll(rememberScrollState())
				.padding(24.dp),
		) {
			Text(
				text = if (scan.hasAnimalId) "Chip erkannt" else "Tag gelesen",
				style = MaterialTheme.typography.headlineLarge,
			)
			Text(
				text = formatTime(scan.scannedAt),
				style = MaterialTheme.typography.bodyMedium,
				color = MaterialTheme.colorScheme.onSurfaceVariant,
			)
			Spacer(Modifier.height(20.dp))
			Column(
				modifier = Modifier
					.fillMaxWidth()
					.background(MaterialTheme.colorScheme.surface, RoundedCornerShape(20.dp))
					.padding(20.dp),
				horizontalAlignment = Alignment.CenterHorizontally,
			) {
				Icon(Icons.Outlined.Nfc, contentDescription = null, tint = if (scan.hasAnimalId) SuccessGreen else Putty500)
				Spacer(Modifier.height(12.dp))
				Text(
					text = scan.formattedAnimalId ?: scan.uidHex.ifBlank { "Keine ID" },
					style = MaterialTheme.typography.headlineMedium,
					fontFamily = FontFamily.Monospace,
				)
				Text(
					text = if (scan.hasAnimalId) "ISO 11784 Tieridentnummer" else "Tag-UID (kein ISO-11784-Code erkannt)",
					style = MaterialTheme.typography.bodyMedium,
					color = MaterialTheme.colorScheme.onSurfaceVariant,
				)
			}
			Spacer(Modifier.height(16.dp))
			InfoRow("Tierart", "Hund / Pferd – im Chip nicht hinterlegt")
			if (scan.countryName != null) {
				InfoRow(
					"Herkunft / Hersteller",
					buildString {
						append(scan.countryName)
						scan.countryCode?.let { append(" ($it)") }
						if (scan.isManufacturerCode && scan.manufacturerName != null) {
							append(" · ${scan.manufacturerName}")
						}
					},
				)
			}
			scan.nationalIdentification?.let { InfoRow("Nationale Nummer", it) }
			scan.isAnimalApplication?.let { InfoRow("Animal-Flag", if (it) "Ja" else "Nein") }
			InfoRow("Technologie", scan.technologies.joinToString(", ").ifBlank { "unbekannt" })
			InfoRow("UID", scan.uidHex.ifBlank { "—" })
			scan.ndefSummary?.let { InfoRow("NDEF", it) }
			scan.decodeSource?.let { InfoRow("Decodierung", it) }
			if (scan.payloadHex.isNotBlank()) {
				InfoRow("Rohdaten", scan.payloadHex)
			}
		}
		Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
			Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
				FilledTonalButton(
					onClick = {
						copyToClipboard(context, scan.compactAnimalId ?: scan.uidHex)
						scope.launch { snackbar.showSnackbar("Kopiert") }
					},
					modifier = Modifier.weight(1f),
				) {
					Icon(Icons.Outlined.ContentCopy, contentDescription = null)
					Spacer(Modifier.padding(4.dp))
					Text("Kopieren")
				}
				FilledTonalButton(
					onClick = { share(context, shareText) },
					modifier = Modifier.weight(1f),
				) {
					Icon(Icons.Outlined.Share, contentDescription = null)
					Spacer(Modifier.padding(4.dp))
					Text("Teilen")
				}
			}
			Button(onClick = onScanAgain, modifier = Modifier.fillMaxWidth()) {
				Text("Weiteren Chip scannen")
			}
		}
		SnackbarHost(snackbar)
	}
}

@Composable
private fun InfoRow(label: String, value: String) {
	Column(
		modifier = Modifier
			.fillMaxWidth()
			.padding(vertical = 8.dp),
	) {
		Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
		Text(value, style = MaterialTheme.typography.bodyLarge, fontFamily = FontFamily.Monospace)
	}
}

private fun formatTime(epoch: Long): String =
	SimpleDateFormat("dd.MM.yyyy HH:mm:ss", Locale.GERMANY).format(Date(epoch))

private fun copyToClipboard(context: Context, text: String) {
	val clipboard = context.getSystemService(ClipboardManager::class.java)
	clipboard.setPrimaryClip(ClipData.newPlainText("Tierchip", text))
}

private fun share(context: Context, text: String) {
	val intent = Intent(Intent.ACTION_SEND).apply {
		type = "text/plain"
		putExtra(Intent.EXTRA_TEXT, text)
	}
	context.startActivity(Intent.createChooser(intent, "Chipnummer teilen"))
}

private fun buildShareText(scan: ChipScan): String = buildString {
	appendLine("Tierchip-Scanner")
	scan.formattedAnimalId?.let { appendLine("ISO 11784: $it") }
	scan.compactAnimalId?.let { appendLine("Nummer: $it") }
	scan.countryName?.let { appendLine("Land/Hersteller: $it") }
	appendLine("UID: ${scan.uidHex}")
	appendLine("Technik: ${scan.technologies.joinToString()}")
}
