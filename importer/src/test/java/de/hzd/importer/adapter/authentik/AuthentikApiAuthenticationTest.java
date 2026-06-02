package de.hzd.importer.adapter.authentik;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AuthentikApiAuthenticationTest {

	@Mock
	ImporterConfig config;

	@Mock
	ImporterConfig.AuthentikConfig authentikConfig;

	@InjectMocks
	AuthentikApiAuthentication authentication;

	@BeforeEach
	void setUp() {
		MockitoAnnotations.openMocks(this);
		when(config.authentik()).thenReturn(authentikConfig);
		when(authentikConfig.baseUrl()).thenReturn("https://auth.example.org");
	}

	@Test
	void validateConfiguration_acceptsApiToken() {
		when(authentikConfig.apiToken()).thenReturn(Optional.of("test-token"));

		assertDoesNotThrow(() -> authentication.validateConfiguration());
	}

	@Test
	void validateConfiguration_acceptsUsernamePassword() {
		when(authentikConfig.apiToken()).thenReturn(Optional.empty());
		when(authentikConfig.username()).thenReturn(Optional.of("admin"));
		when(authentikConfig.password()).thenReturn(Optional.of("secret"));

		assertDoesNotThrow(() -> authentication.validateConfiguration());
	}

	@Test
	void validateConfiguration_rejectsMissingCredentials() {
		when(authentikConfig.apiToken()).thenReturn(Optional.empty());
		when(authentikConfig.username()).thenReturn(Optional.empty());
		when(authentikConfig.password()).thenReturn(Optional.empty());

		assertThrows(
			AuthentikClientException.class,
			() -> authentication.validateConfiguration()
		);
	}

	@Test
	void validateConfiguration_prefersApiTokenOverIncompleteUsernamePassword() {
		when(authentikConfig.apiToken()).thenReturn(Optional.of("test-token"));
		when(authentikConfig.username()).thenReturn(Optional.empty());

		assertDoesNotThrow(() -> authentication.validateConfiguration());
	}
}
