package de.hzd.animalchipreader.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Nfc
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import de.hzd.animalchipreader.ScanUiState
import de.hzd.animalchipreader.data.ChipScan
import de.hzd.animalchipreader.ui.history.HistoryScreen
import de.hzd.animalchipreader.ui.info.InfoScreen
import de.hzd.animalchipreader.ui.result.ResultScreen
import de.hzd.animalchipreader.ui.scan.ScanScreen

private object Routes {
	const val SCAN = "scan"
	const val RESULT = "result"
	const val HISTORY = "history"
	const val INFO = "info"
}

@Composable
fun AnimalChipApp(
	state: ScanUiState,
	history: List<ChipScan>,
	onSelectScan: (ChipScan) -> Unit,
	onClearHistory: () -> Unit,
	onResultOpened: () -> Unit,
) {
	val navController = rememberNavController()
	val backStack by navController.currentBackStackEntryAsState()
	val currentRoute = backStack?.destination?.route ?: Routes.SCAN

	LaunchedEffect(state.openResult, state.lastScan?.id) {
		if (state.openResult && state.lastScan != null) {
			navController.navigate(Routes.RESULT) {
				launchSingleTop = true
			}
			onResultOpened()
		}
	}

	fun navigateTab(route: String) {
		navController.navigate(route) {
			popUpTo(navController.graph.findStartDestination().id) {
				saveState = true
			}
			launchSingleTop = true
			restoreState = true
		}
	}

	Scaffold(
		bottomBar = {
			NavigationBar {
				NavigationBarItem(
					selected = currentRoute == Routes.SCAN || currentRoute == Routes.RESULT,
					onClick = { navigateTab(Routes.SCAN) },
					icon = { Icon(Icons.Outlined.Nfc, contentDescription = null) },
					label = { Text("Scannen") },
				)
				NavigationBarItem(
					selected = currentRoute == Routes.HISTORY,
					onClick = { navigateTab(Routes.HISTORY) },
					icon = { Icon(Icons.Outlined.History, contentDescription = null) },
					label = { Text("Verlauf") },
				)
				NavigationBarItem(
					selected = currentRoute == Routes.INFO,
					onClick = { navigateTab(Routes.INFO) },
					icon = { Icon(Icons.Outlined.Info, contentDescription = null) },
					label = { Text("Hinweis") },
				)
			}
		},
	) { padding ->
		NavHost(
			navController = navController,
			startDestination = Routes.SCAN,
			modifier = Modifier.padding(padding),
		) {
			composable(Routes.SCAN) {
				ScanScreen(state = state)
			}
			composable(Routes.RESULT) {
				val scan = state.lastScan
				if (scan == null) {
					ScanScreen(state = state)
				} else {
					ResultScreen(
						scan = scan,
						onScanAgain = { navController.popBackStack(Routes.SCAN, inclusive = false) },
					)
				}
			}
			composable(Routes.HISTORY) {
				HistoryScreen(
					history = history,
					onOpen = { scan ->
						onSelectScan(scan)
						navController.navigate(Routes.RESULT)
					},
					onClear = onClearHistory,
				)
			}
			composable(Routes.INFO) {
				InfoScreen()
			}
		}
	}
}
