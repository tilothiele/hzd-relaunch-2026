package de.hzd.importer.adapter.persistence;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "importjobs")
public class ImportJobHistoryEntity extends PanacheEntityBase {

	@Id
	@Column(columnDefinition = "uuid")
	public UUID id;

	@Column(nullable = false)
	public int generation;

	@Column(name = "started_at", nullable = false)
	public Instant startedAt;

	@Column(name = "finished_at")
	public Instant finishedAt;

	@Column(name = "member_count", nullable = false)
	public int memberCount;

	@Column(name = "dog_count", nullable = false)
	public int dogCount;

	@Column(name = "member_changed_count", nullable = false)
	public int memberChangedCount;

	@Column(name = "member_new_count", nullable = false)
	public int memberNewCount;

	@Column(name = "dog_changed_count", nullable = false)
	public int dogChangedCount;

	@Column(name = "dog_new_count", nullable = false)
	public int dogNewCount;
}
