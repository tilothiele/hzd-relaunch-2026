package de.hzd.animalchipreader.data

import de.hzd.animalchipreader.nfc.Iso11784Id
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class ChipScan(
	val id: String = UUID.randomUUID().toString(),
	val scannedAt: Long = System.currentTimeMillis(),
	val formattedAnimalId: String? = null,
	val compactAnimalId: String? = null,
	val countryCode: Int? = null,
	val countryName: String? = null,
	val isManufacturerCode: Boolean = false,
	val manufacturerName: String? = null,
	val nationalIdentification: String? = null,
	val isAnimalApplication: Boolean? = null,
	val hasAdditionalData: Boolean? = null,
	val technologies: List<String> = emptyList(),
	val uidHex: String = "",
	val payloadHex: String = "",
	val ndefSummary: String? = null,
	val decodeSource: String? = null,
) {
	val hasAnimalId: Boolean get() = !compactAnimalId.isNullOrBlank()

	companion object {
		fun from(
			iso: Iso11784Id?,
			technologies: List<String>,
			uidHex: String,
			payloadHex: String,
			ndefSummary: String?,
		): ChipScan = ChipScan(
			formattedAnimalId = iso?.groupedId,
			compactAnimalId = iso?.compactId,
			countryCode = iso?.countryCode,
			countryName = iso?.countryName,
			isManufacturerCode = iso?.isManufacturerCode == true,
			manufacturerName = iso?.manufacturerName,
			nationalIdentification = iso?.nationalIdentification,
			isAnimalApplication = iso?.isAnimalApplication,
			hasAdditionalData = iso?.hasAdditionalData,
			technologies = technologies,
			uidHex = uidHex,
			payloadHex = payloadHex,
			ndefSummary = ndefSummary,
			decodeSource = iso?.source,
		)
	}
}
