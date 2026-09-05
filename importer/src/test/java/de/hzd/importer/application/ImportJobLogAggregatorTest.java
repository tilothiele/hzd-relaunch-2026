package de.hzd.importer.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobLogLevel;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ImportJobLogAggregatorTest {

	@Test
	void collectsFormattedEntriesAndSnapshotIsImmutableCopy() {
		ImportJobLogAggregator aggregator = new ImportJobLogAggregator();
		UUID jobId = UUID.fromString("11111111-1111-1111-1111-111111111111");
		aggregator.start(jobId);
		aggregator.info("Loaded %d members", 3);
		aggregator.warn("skipped row");
		aggregator.error("boom %s", new IllegalStateException("disk full"), "now");

		ImportJobLog snapshot = aggregator.snapshot();
		assertEquals(jobId, snapshot.jobId());
		assertEquals(3, snapshot.size());
		assertEquals(ImportJobLogLevel.INFO, snapshot.entries().get(0).level());
		assertEquals("Loaded 3 members", snapshot.entries().get(0).message());
		assertEquals(ImportJobLogLevel.WARN, snapshot.entries().get(1).level());
		assertEquals(ImportJobLogLevel.ERROR, snapshot.entries().get(2).level());
		assertTrue(snapshot.entries().get(2).message().contains("boom now"));
		assertTrue(snapshot.entries().get(2).message().contains("disk full"));

		aggregator.clear();
		assertEquals(0, aggregator.snapshot().size());
		assertEquals(3, snapshot.size());
	}
}
