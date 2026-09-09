package de.hzd.animalchipreader.ui.history

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import de.hzd.animalchipreader.data.ChipScan
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(
	history: List<ChipScan>,
	onOpen: (ChipScan) -> Unit,
	onClear: () -> Unit,
) {
	Column(modifier = Modifier.fillMaxSize()) {
		Row(
			modifier = Modifier
				.fillMaxWidth()
				.padding(24.dp),
			horizontalArrangement = Arrangement.SpaceBetween,
			verticalAlignment = Alignment.CenterVertically,
		) {
			Column {
				Text("Verlauf", style = MaterialTheme.typography.headlineLarge)
				Text(
					"${history.size} Scans auf diesem Gerät",
					style = MaterialTheme.typography.bodyMedium,
					color = MaterialTheme.colorScheme.onSurfaceVariant,
				)
			}
			if (history.isNotEmpty()) {
				IconButton(onClick = onClear) {
					Icon(Icons.Outlined.Delete, contentDescription = "Verlauf löschen")
				}
			}
		}
		if (history.isEmpty()) {
			Text(
				"Noch keine Chips gelesen.",
				modifier = Modifier.padding(horizontal = 24.dp),
				color = MaterialTheme.colorScheme.onSurfaceVariant,
			)
		} else {
			LazyColumn(contentPadding = PaddingValues(horizontal = 24.dp, vertical = 8.dp)) {
				items(history, key = { it.id }) { scan ->
					Column(
						modifier = Modifier
							.fillMaxWidth()
							.clickable { onOpen(scan) }
							.padding(vertical = 12.dp),
					) {
						Text(
							text = scan.formattedAnimalId ?: scan.uidHex,
							style = MaterialTheme.typography.titleLarge,
							fontFamily = FontFamily.Monospace,
						)
						Text(
							text = listOfNotNull(
								scan.countryName,
								scan.manufacturerName,
								SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.GERMANY).format(Date(scan.scannedAt)),
							).joinToString(" · "),
							style = MaterialTheme.typography.bodyMedium,
							color = MaterialTheme.colorScheme.onSurfaceVariant,
						)
					}
				}
			}
		}
	}
}
