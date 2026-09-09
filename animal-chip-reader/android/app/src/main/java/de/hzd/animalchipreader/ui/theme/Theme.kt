package de.hzd.animalchipreader.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val ColorScheme = darkColorScheme(
	primary = Putty500,
	onPrimary = Astronaut100,
	primaryContainer = Astronaut300,
	onPrimaryContainer = Putty700,
	secondary = Astronaut500,
	onSecondary = Astronaut900,
	background = Astronaut100,
	onBackground = Astronaut900,
	surface = Astronaut200,
	onSurface = Astronaut900,
	surfaceVariant = Astronaut300,
	onSurfaceVariant = Astronaut700,
	error = ErrorRose,
	onError = Astronaut100,
	outline = PineCone400,
)

@Composable
fun AnimalChipTheme(content: @Composable () -> Unit) {
	MaterialTheme(
		colorScheme = ColorScheme,
		typography = Typography,
		content = content,
	)
}
