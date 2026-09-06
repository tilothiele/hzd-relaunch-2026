package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import org.junit.jupiter.api.Test;

class StrapiRestClientUriTest {

	@Test
	void rewritesLocalhostToIpv4Loopback() {
		URI uri = StrapiRestClient.requestUri("http://localhost:1337/api/users?page=1");
		assertEquals("http://127.0.0.1:1337/api/users?page=1", uri.toString());
	}

	@Test
	void keepsExplicitIpv4Host() {
		URI uri = StrapiRestClient.requestUri("http://127.0.0.1:1337/api/users");
		assertEquals("http://127.0.0.1:1337/api/users", uri.toString());
	}
}
