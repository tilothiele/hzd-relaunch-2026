package de.hzd.importer.domain;

public enum UserRegion {
	Nord("Nord"),
	Ost("Ost"),
	Mitte("Mitte"),
	West("West"),
	Sued("Süd");

	private final String strapiValue;

	UserRegion(String strapiValue) {
		this.strapiValue = strapiValue;
	}

	public String strapiValue() {
		return strapiValue;
	}
}
