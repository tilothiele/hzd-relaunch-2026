package de.hzd.importer.domain;

public record ImportStatistics(
		int membersCreated,
		int membersUpdated,
		int membersSkipped,
		int membersFailed,
		int dogsCreated,
		int dogsUpdated,
		int dogsFailed,
		int breedersCreated
) {
	public static ImportStatistics empty() {
		return new ImportStatistics(0, 0, 0, 0, 0, 0, 0, 0);
	}

	public ImportStatistics withMembersCreated(int count) {
		return new ImportStatistics(
			membersCreated + count,
			membersUpdated,
			membersSkipped,
			membersFailed,
			dogsCreated,
			dogsUpdated,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withMembersUpdated(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated + count,
			membersSkipped,
			membersFailed,
			dogsCreated,
			dogsUpdated,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withMembersSkipped(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped + count,
			membersFailed,
			dogsCreated,
			dogsUpdated,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withMembersFailed(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped,
			membersFailed + count,
			dogsCreated,
			dogsUpdated,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withDogsCreated(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped,
			membersFailed,
			dogsCreated + count,
			dogsUpdated,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withDogsUpdated(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped,
			membersFailed,
			dogsCreated,
			dogsUpdated + count,
			dogsFailed,
			breedersCreated
		);
	}

	public ImportStatistics withDogsFailed(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped,
			membersFailed,
			dogsCreated,
			dogsUpdated,
			dogsFailed + count,
			breedersCreated
		);
	}

	public ImportStatistics withBreedersCreated(int count) {
		return new ImportStatistics(
			membersCreated,
			membersUpdated,
			membersSkipped,
			membersFailed,
			dogsCreated,
			dogsUpdated,
			dogsFailed,
			breedersCreated + count
		);
	}
}
