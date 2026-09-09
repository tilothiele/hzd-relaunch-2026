package de.hzd.animalchipreader.ui.scan

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Nfc
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import de.hzd.animalchipreader.ScanUiState
import de.hzd.animalchipreader.ui.theme.Putty500
import de.hzd.animalchipreader.ui.theme.SuccessGreen
import de.hzd.animalchipreader.ui.theme.WarningAmber

@Composable
fun ScanScreen(state: ScanUiState) {
	Column(
		modifier = Modifier
			.fillMaxSize()
			.padding(horizontal = 24.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
	) {
		Spacer(Modifier.height(28.dp))
		Text(
			text = "Tierchip-Scanner",
			style = MaterialTheme.typography.headlineLarge,
			color = MaterialTheme.colorScheme.onBackground,
		)
		Text(
			text = "Hund & Pferd · ISO 11784",
			style = MaterialTheme.typography.bodyLarge,
			color = MaterialTheme.colorScheme.onSurfaceVariant,
		)
		Spacer(Modifier.height(36.dp))
		NfcPulse(active = state.isListening)
		Spacer(Modifier.height(28.dp))
		Text(
			text = when {
				!state.nfcAvailable -> "Kein NFC-Modul"
				!state.nfcEnabled -> "NFC ist ausgeschaltet"
				else -> "Handy an den Chip halten"
			},
			style = MaterialTheme.typography.headlineMedium,
			textAlign = TextAlign.Center,
		)
		Spacer(Modifier.height(8.dp))
		Text(
			text = state.statusMessage
				?: "Die Oberseite des Telefons flach an die Chipstelle führen. Hunde: meist links neben dem Widerrist. Pferde: linke Halsseite, Mittelfalte.",
			style = MaterialTheme.typography.bodyMedium,
			color = MaterialTheme.colorScheme.onSurfaceVariant,
			textAlign = TextAlign.Center,
		)
		Spacer(Modifier.height(28.dp))
		Row(
			modifier = Modifier.fillMaxWidth(),
			horizontalArrangement = Arrangement.spacedBy(12.dp),
		) {
			HintChip(Modifier.weight(1f), "Hund", "Widerrist")
			HintChip(Modifier.weight(1f), "Pferd", "linker Hals")
		}
		Spacer(Modifier.height(16.dp))
		FrequencyNote()
	}
}

@Composable
private fun NfcPulse(active: Boolean) {
	val transition = rememberInfiniteTransition(label = "nfc-pulse")
	val scale by transition.animateFloat(
		initialValue = 1f,
		targetValue = if (active) 1.18f else 1f,
		animationSpec = infiniteRepeatable(
			animation = tween(1400, easing = LinearEasing),
			repeatMode = RepeatMode.Reverse,
		),
		label = "scale",
	)
	val ringAlpha by transition.animateFloat(
		initialValue = 0.55f,
		targetValue = if (active) 0.12f else 0.35f,
		animationSpec = infiniteRepeatable(
			animation = tween(1400, easing = LinearEasing),
			repeatMode = RepeatMode.Reverse,
		),
		label = "alpha",
	)
	Box(contentAlignment = Alignment.Center, modifier = Modifier.size(220.dp)) {
		Box(
			modifier = Modifier
				.size(220.dp)
				.scale(scale)
				.graphicsLayer { alpha = ringAlpha }
				.border(2.dp, Putty500, CircleShape),
		)
		Box(
			modifier = Modifier
				.size(150.dp)
				.background(MaterialTheme.colorScheme.surface, CircleShape)
				.border(1.dp, Putty500.copy(alpha = 0.5f), CircleShape),
			contentAlignment = Alignment.Center,
		) {
			Icon(
				imageVector = Icons.Outlined.Nfc,
				contentDescription = null,
				tint = if (active) SuccessGreen else WarningAmber,
				modifier = Modifier.size(72.dp),
			)
		}
	}
}

@Composable
private fun HintChip(modifier: Modifier, title: String, subtitle: String) {
	Column(
		modifier = modifier
			.background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
			.padding(16.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
	) {
		Icon(Icons.Outlined.Pets, contentDescription = null, tint = Putty500)
		Spacer(Modifier.height(8.dp))
		Text(title, style = MaterialTheme.typography.titleLarge)
		Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
	}
}

@Composable
private fun FrequencyNote() {
	Row(
		modifier = Modifier
			.fillMaxWidth()
			.background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
			.padding(16.dp),
		horizontalArrangement = Arrangement.spacedBy(12.dp),
		verticalAlignment = Alignment.Top,
	) {
		Icon(Icons.Outlined.Warning, contentDescription = null, tint = WarningAmber)
		Text(
			text = "Klassische Implantate nach ISO 11785 senden auf 134,2 kHz. Handy-NFC arbeitet auf 13,56 MHz. NFC-Halsbandmarken und ISO-15693-Transponder werden direkt gelesen.",
			style = MaterialTheme.typography.bodyMedium,
			color = MaterialTheme.colorScheme.onSurfaceVariant,
		)
	}
}
