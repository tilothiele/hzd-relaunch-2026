package de.hzd.importer.adapter.strapi;

public class StrapiTransientException extends RuntimeException {

	public StrapiTransientException(String message) {
		super(message);
	}

	public StrapiTransientException(String message, Throwable cause) {
		super(message, cause);
	}
}
