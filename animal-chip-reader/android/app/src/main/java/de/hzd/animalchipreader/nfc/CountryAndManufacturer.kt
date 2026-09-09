package de.hzd.animalchipreader.nfc

object CountryRegistry {
	private val names = mapOf(
		40 to "Österreich",
		56 to "Belgien",
		100 to "Bulgarien",
		191 to "Kroatien",
		196 to "Zypern",
		203 to "Tschechien",
		208 to "Dänemark",
		233 to "Estland",
		246 to "Finnland",
		250 to "Frankreich",
		276 to "Deutschland",
		300 to "Griechenland",
		348 to "Ungarn",
		352 to "Island",
		372 to "Irland",
		380 to "Italien",
		428 to "Lettland",
		440 to "Litauen",
		442 to "Luxemburg",
		470 to "Malta",
		528 to "Niederlande",
		578 to "Norwegen",
		616 to "Polen",
		620 to "Portugal",
		642 to "Rumänien",
		703 to "Slowakei",
		705 to "Slowenien",
		724 to "Spanien",
		752 to "Schweden",
		756 to "Schweiz",
		826 to "Vereinigtes Königreich",
		840 to "Vereinigte Staaten",
		36 to "Australien",
		124 to "Kanada",
		392 to "Japan",
		554 to "Neuseeland",
		710 to "Südafrika",
	)

	fun nameFor(code: Int): String? = names[code]
}

object ManufacturerRegistry {
	private val names = mapOf(
		900 to "ICAR / unspezifiziert",
		901 to "Trovan Unique",
		911 to "AVID",
		915 to "ID4Animal",
		926 to "Planet ID",
		933 to "Datamars",
		935 to "PeddyMark",
		939 to "Planet ID",
		948 to "Allflex",
		953 to "Bayer",
		955 to "Virbac",
		956 to "AVID",
		962 to "Datamars",
		965 to "PetCode",
		968 to "Datamars",
		970 to "Nedap",
		972 to "Peddy-Mark",
		978 to "MicrochipID",
		981 to "Allflex",
		982 to "Allflex",
		985 to "Trovan",
		991 to "Planet ID",
		994 to "SmartTrac",
	)

	fun nameFor(code: Int): String? = names[code]
}
