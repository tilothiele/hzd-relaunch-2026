package de.hzd.importer.support;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;

@QuarkusTest
@QuarkusTestResource(ImporterTestResource.class)
public abstract class QuarkusIntegrationTest {
}
