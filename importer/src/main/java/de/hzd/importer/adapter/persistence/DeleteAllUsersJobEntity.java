package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.ImportJobStatus;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "delete_all_users_jobs")
public class DeleteAllUsersJobEntity extends PanacheEntityBase {

	@Id
	@Column(columnDefinition = "uuid")
	public UUID id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	public ImportJobStatus status;

	@Column(nullable = false)
	public Instant startedAt;

	public Instant finishedAt;

	@Column(length = 4000)
	public String message;

	@Column(nullable = false)
	public int usersDeleted;

	@Column(nullable = false)
	public int usersTotal;
}
