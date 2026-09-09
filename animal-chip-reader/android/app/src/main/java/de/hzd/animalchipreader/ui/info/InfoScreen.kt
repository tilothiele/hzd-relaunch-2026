package de.hzd.animalchipreader.ui.info

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun InfoScreen() {
	Column(
		modifier = Modifier
			.fillMaxSize()
			.verticalScroll(rememberScrollState())
			.padding(24.dp),
	) {
		Text("Hinweise", style = MaterialTheme.typography.headlineLarge)
		Spacer(Modifier.height(16.dp))
		Section(
			"Was die App liest",
			"EU-Hunde und -Pferde tragen in der Regel einen Transponder nach ISO 11784/11785. Die 15-stellige Nummer (3 Stellen Land/Hersteller + 12 Stellen nationale ID) wird angezeigt, sobald sie aus UID, Speicher oder NDEF gelesen werden kann.",
		)
		Section(
			"NFC im Handy",
			"Android-NFC arbeitet auf 13,56 MHz (ISO 14443 und ISO 15693 / NFC-V). Viele implantierte Tierchips senden nur auf 134,2 kHz (FDX-B). Diese Implantate braucht ein 134,2-kHz-Lesegerät. NFC-Halsbandmarken, ISO-15693-Ohrmarken und Dual-Frequency-Chips funktionieren mit dem Telefon.",
		)
		Section(
			"So scannen",
			"NFC einschalten, App öffnen, die NFC-Antenne (meist am oberen Geräteende) ruhig an die Chipstelle halten. Hund: links neben dem Widerrist. Pferd: linke Halsseite in der Mähnenkammfalte. Einige Sekunden stillhalten.",
		)
		Section(
			"Was der Chip nicht speichert",
			"Die Tierart, der Name und der Besitzer stehen nicht auf dem Chip. Die Nummer kann in Registern wie Tasso, Findefix, EU-Heimtierausweis oder Equidenpass nachgeschlagen werden.",
		)
	}
}

@Composable
private fun Section(title: String, body: String) {
	Text(title, style = MaterialTheme.typography.titleLarge)
	Spacer(Modifier.height(6.dp))
	Text(body, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
	Spacer(Modifier.height(20.dp))
}
