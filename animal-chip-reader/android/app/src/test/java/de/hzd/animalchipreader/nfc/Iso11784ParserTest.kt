package de.hzd.animalchipreader.nfc

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class Iso11784ParserTest {
	@Test
	fun decodesGermanAnimalIdLittleEndian() {
		val bytes = Iso11784Parser.encodeLe(country = 276, national = 98_101_234_567)
		val parsed = Iso11784Parser.parse(bytes)
		assertThat(parsed).isNotNull()
		assertThat(parsed!!.compactId).isEqualTo("276098101234567")
		assertThat(parsed.groupedId).isEqualTo("276 0981 0123 4567")
		assertThat(parsed.countryName).isEqualTo("Deutschland")
		assertThat(parsed.isAnimalApplication).isTrue()
		assertThat(parsed.isManufacturerCode).isFalse()
	}

	@Test
	fun decodesAllflexManufacturerCode() {
		val bytes = Iso11784Parser.encodeLe(country = 981, national = 1_234_567)
		val parsed = Iso11784Parser.parse(bytes)!!
		assertThat(parsed.manufacturerName).isEqualTo("Allflex")
		assertThat(parsed.isManufacturerCode).isTrue()
		assertThat(parsed.compactId).isEqualTo("981000001234567")
	}

	@Test
	fun parsesFifteenDigitText() {
		val parsed = Iso11784Parser.parseDecimal("Chip: 276 0981 0123 4567")!!
		assertThat(parsed.compactId).isEqualTo("276098101234567")
		assertThat(parsed.countryName).isEqualTo("Deutschland")
	}

	@Test
	fun rejectsInvalidCountry() {
		assertThat(Iso11784Parser.parse64(1uL, "test")).isNull()
	}
}
