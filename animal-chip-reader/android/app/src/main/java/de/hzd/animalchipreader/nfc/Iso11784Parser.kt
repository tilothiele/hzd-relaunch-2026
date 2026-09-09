package de.hzd.animalchipreader.nfc

/**
 * ISO 11784 Identifikationscode (64 Bit), wie er bei Hunde- und Pferdechips
 * nach ISO 11784/11785 verwendet wird.
 *
 * Bit 0:        Animal-Application-Flag
 * Bits 1–14:    reserviert
 * Bit 15:       Zusatzdaten vorhanden
 * Bits 16–25:   Ländercode (ISO 3166 numerisch) oder Hersteller 900–998
 * Bits 26–63:   nationale Identifikationsnummer (38 Bit)
 */
data class Iso11784Id(
	val compactId: String,
	val groupedId: String,
	val countryCode: Int,
	val countryName: String,
	val isManufacturerCode: Boolean,
	val manufacturerName: String?,
	val nationalIdentification: String,
	val isAnimalApplication: Boolean,
	val hasAdditionalData: Boolean,
	val reservedBitsZero: Boolean,
	val source: String,
)

object Iso11784Parser {
	private val fifteenDigits = Regex("""(?<!\d)\d{15}(?!\d)""")

	fun parse(bytes: ByteArray, source: String = "payload"): Iso11784Id? {
		if (bytes.size < 8) return null
		for (offset in 0..bytes.size - 8) {
			val slice = bytes.copyOfRange(offset, offset + 8)
			parse64(toULongLe(slice), "$source LE@$offset")?.let { return it }
			parse64(toULongBe(slice), "$source BE@$offset")?.let { return it }
		}
		return null
	}

	fun parseDecimal(raw: String, source: String = "text"): Iso11784Id? {
		val digits = raw.filter { it.isDigit() }
		fifteenDigits.findAll(digits).forEach { match ->
			fromFifteenDigits(match.value, source)?.let { return it }
		}
		if (digits.length == 15) {
			fromFifteenDigits(digits, source)?.let { return it }
		}
		return null
	}

	fun parseBest(uid: ByteArray, payloads: List<ByteArray>, texts: List<String>): Iso11784Id? {
		texts.forEach { parseDecimal(it, "ndef")?.let { id -> return id } }
		payloads.forEach { parse(it, "memory")?.let { id -> return id } }
		return parse(uid, "uid")
	}

	internal fun fromFifteenDigits(digits: String, source: String): Iso11784Id? {
		if (digits.length != 15 || !digits.all { it.isDigit() }) return null
		val country = digits.substring(0, 3).toInt()
		val national = digits.substring(3).toLong()
		return assemble(
			country = country,
			national = national.toULong(),
			isAnimal = true,
			hasExtra = false,
			reservedZero = true,
			source = source,
			strictCountry = false,
		)
	}

	internal fun parse64(bits: ULong, source: String): Iso11784Id? {
		val isAnimal = (bits and 1uL) == 1uL
		val reserved = (bits shr 1) and 0x3FFFuL
		val extra = ((bits shr 15) and 1uL) == 1uL
		val country = ((bits shr 16) and 0x3FFuL).toInt()
		val national = bits shr 26
		return assemble(
			country = country,
			national = national,
			isAnimal = isAnimal,
			hasExtra = extra,
			reservedZero = reserved == 0uL,
			source = source,
			strictCountry = true,
		)
	}

	private fun assemble(
		country: Int,
		national: ULong,
		isAnimal: Boolean,
		hasExtra: Boolean,
		reservedZero: Boolean,
		source: String,
		strictCountry: Boolean,
	): Iso11784Id? {
		if (country !in 1..998) return null
		if (national > 999_999_999_999uL) return null
		if (strictCountry && !reservedZero) return null
		if (strictCountry && !isAnimal) return null
		val isManufacturer = country in 900..998
		val countryName = CountryRegistry.nameFor(country)
		if (strictCountry && countryName == null && !isManufacturer) return null
		val nationalPadded = national.toString().padStart(12, '0')
		val compact = "%03d%s".format(country, nationalPadded)
		return Iso11784Id(
			compactId = compact,
			groupedId = formatGrouped(compact),
			countryCode = country,
			countryName = countryName ?: if (isManufacturer) "Herstellercode" else "Unbekannt",
			isManufacturerCode = isManufacturer,
			manufacturerName = ManufacturerRegistry.nameFor(country),
			nationalIdentification = nationalPadded,
			isAnimalApplication = isAnimal,
			hasAdditionalData = hasExtra,
			reservedBitsZero = reservedZero,
			source = source,
		)
	}

	fun formatGrouped(compact15: String): String {
		val digits = compact15.filter { it.isDigit() }.padStart(15, '0').take(15)
		return listOf(
			digits.substring(0, 3),
			digits.substring(3, 7),
			digits.substring(7, 11),
			digits.substring(11, 15),
		).joinToString(" ")
	}

	fun toULongLe(bytes: ByteArray): ULong {
		var value = 0uL
		for (i in 0 until 8) {
			value = value or (bytes[i].toUByte().toULong() shl (8 * i))
		}
		return value
	}

	fun toULongBe(bytes: ByteArray): ULong {
		var value = 0uL
		for (i in 0 until 8) {
			value = (value shl 8) or bytes[i].toUByte().toULong()
		}
		return value
	}

	fun encodeLe(country: Int, national: Long, animal: Boolean = true, extra: Boolean = false): ByteArray {
		var bits = 0uL
		if (animal) bits = bits or 1uL
		if (extra) bits = bits or (1uL shl 15)
		bits = bits or (country.toULong() shl 16)
		bits = bits or (national.toULong() shl 26)
		return ByteArray(8) { i -> ((bits shr (8 * i)) and 0xFFu).toByte() }
	}
}
