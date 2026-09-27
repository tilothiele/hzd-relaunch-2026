package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.Member;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class CsvSnapshotRepository {

	static final int KEPT_GENERATIONS = 3;
	private static final int BATCH_SIZE = 200;

	@Inject
	EntityManager entityManager;

	@Transactional
	public int currentGeneration() {
		ImporterConfigEntity config = ImporterConfigEntity.findById(ImporterConfigEntity.SINGLETON_ID);
		if (config == null) {
			config = new ImporterConfigEntity();
			config.id = ImporterConfigEntity.SINGLETON_ID;
			config.csvGeneration = 0;
			config.persist();
		}
		return config.csvGeneration;
	}

	@Transactional
	public int beginImport(UUID jobId, Instant startedAt) {
		ImporterConfigEntity config = ImporterConfigEntity.findById(ImporterConfigEntity.SINGLETON_ID);
		if (config == null) {
			config = new ImporterConfigEntity();
			config.id = ImporterConfigEntity.SINGLETON_ID;
			config.csvGeneration = 0;
			config.persist();
		}
		config.csvGeneration = config.csvGeneration + 1;

		ImportJobHistoryEntity history = new ImportJobHistoryEntity();
		history.id = jobId;
		history.generation = config.csvGeneration;
		history.startedAt = startedAt;
		history.memberCount = 0;
		history.dogCount = 0;
		history.memberChangedCount = 0;
		history.memberNewCount = 0;
		history.dogChangedCount = 0;
		history.dogNewCount = 0;
		history.persist();
		return config.csvGeneration;
	}

	@Transactional
	public void finishImport(
		UUID jobId,
		Instant finishedAt,
		int memberCount,
		int dogCount,
		int memberChangedCount,
		int memberNewCount,
		int dogChangedCount,
		int dogNewCount
	) {
		ImportJobHistoryEntity history = ImportJobHistoryEntity.findById(jobId);
		if (history == null) {
			return;
		}
		history.finishedAt = finishedAt;
		history.memberCount = memberCount;
		history.dogCount = dogCount;
		history.memberChangedCount = memberChangedCount;
		history.memberNewCount = memberNewCount;
		history.dogChangedCount = dogChangedCount;
		history.dogNewCount = dogNewCount;
	}

	@Transactional
	public List<Member> loadLatestMembers() {
		Integer generation = latestGeneration(CsvMemberSnapshotEntity.class);
		if (generation == null) {
			return List.of();
		}
		return CsvMemberSnapshotEntity.<CsvMemberSnapshotEntity>list("generation", generation).stream()
			.map(CsvMemberSnapshotEntity::toMember)
			.toList();
	}

	@Transactional
	public List<Dog> loadLatestDogs() {
		Integer generation = latestGeneration(CsvDogSnapshotEntity.class);
		if (generation == null) {
			return List.of();
		}
		return CsvDogSnapshotEntity.<CsvDogSnapshotEntity>list("generation", generation).stream()
			.map(CsvDogSnapshotEntity::toDog)
			.toList();
	}

	@Transactional
	public void append(int generation, List<Member> members, List<Dog> dogs) {
		int index = 0;
		for (Member member : lastByCId(members).values()) {
			entityManager.persist(CsvMemberSnapshotEntity.from(member, generation));
			index = flushBatch(index);
		}
		for (Dog dog : lastDogByCId(dogs).values()) {
			entityManager.persist(CsvDogSnapshotEntity.from(dog, generation));
			index = flushBatch(index);
		}
		entityManager.flush();
		purgeOldGenerations(CsvMemberSnapshotEntity.class);
		purgeOldGenerations(CsvDogSnapshotEntity.class);
	}

	private Integer latestGeneration(Class<?> entityType) {
		return entityManager.createQuery(
			"select max(e.generation) from " + entityType.getSimpleName() + " e",
			Integer.class
		).getSingleResult();
	}

	private void purgeOldGenerations(Class<?> entityType) {
		List<Integer> kept = entityManager.createQuery(
			"select distinct e.generation from " + entityType.getSimpleName() + " e order by e.generation desc",
			Integer.class
		).setMaxResults(KEPT_GENERATIONS).getResultList();
		if (kept.size() < KEPT_GENERATIONS) {
			return;
		}
		int oldestKept = kept.get(kept.size() - 1);
		entityManager.createQuery(
			"delete from " + entityType.getSimpleName() + " e where e.generation < :oldestKept"
		).setParameter("oldestKept", oldestKept).executeUpdate();
	}

	private int flushBatch(int index) {
		index++;
		if (index % BATCH_SIZE == 0) {
			entityManager.flush();
			entityManager.clear();
		}
		return index;
	}

	private static Map<Integer, Member> lastByCId(List<Member> members) {
		Map<Integer, Member> byCId = new LinkedHashMap<>();
		for (Member member : members) {
			byCId.put(member.cId(), member);
		}
		return byCId;
	}

	private static Map<Integer, Dog> lastDogByCId(List<Dog> dogs) {
		Map<Integer, Dog> byCId = new LinkedHashMap<>();
		for (Dog dog : dogs) {
			byCId.put(dog.cId(), dog);
		}
		return byCId;
	}
}
