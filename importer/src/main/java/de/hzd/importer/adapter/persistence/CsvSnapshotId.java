package de.hzd.importer.adapter.persistence;

import java.io.Serializable;
import java.util.Objects;

public class CsvSnapshotId implements Serializable {

	public int cId;
	public int generation;

	public CsvSnapshotId() {
	}

	public CsvSnapshotId(int cId, int generation) {
		this.cId = cId;
		this.generation = generation;
	}

	@Override
	public boolean equals(Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof CsvSnapshotId that)) {
			return false;
		}
		return cId == that.cId && generation == that.generation;
	}

	@Override
	public int hashCode() {
		return Objects.hash(cId, generation);
	}
}
