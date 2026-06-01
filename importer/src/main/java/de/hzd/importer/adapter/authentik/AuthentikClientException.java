package de.hzd.importer.adapter.authentik;

public class AuthentikClientException extends RuntimeException {

	public AuthentikClientException(String message) {
		super(message);
	}

	public AuthentikClientException(String message, Throwable cause) {
		super(message, cause);
	}
}
