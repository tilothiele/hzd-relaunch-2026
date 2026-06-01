package de.hzd.importer.adapter.strapi;

public class StrapiClientException extends RuntimeException {

	public StrapiClientException(String message) {
		super(message);
	}

	public StrapiClientException(String message, Throwable cause) {
		super(message, cause);
	}
}
