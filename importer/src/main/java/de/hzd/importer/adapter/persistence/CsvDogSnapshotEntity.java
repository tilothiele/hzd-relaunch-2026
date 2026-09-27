package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.Optional;

@Entity
@Table(name = "csv_dogs")
@IdClass(CsvSnapshotId.class)
public class CsvDogSnapshotEntity extends PanacheEntityBase {

	@Id
	@Column(name = "c_id", nullable = false)
	public int cId;

	@Id
	@Column(nullable = false)
	public int generation;

	@Column(name = "given_name")
	public String givenName;

	@Column(name = "full_kennel_name", length = 500)
	public String fullKennelName;

	@Column(name = "breeder_id")
	public Integer breederId;

	@Column(name = "owner_id")
	public Integer ownerId;

	@Column(name = "chip_number")
	public String chipNumber;

	public String sex;

	@Column(name = "date_of_birth")
	public LocalDate dateOfBirth;

	@Column(name = "date_of_death")
	public LocalDate dateOfDeath;

	@Column(name = "c_fertile")
	public Boolean cFertile;

	public String hd;

	public String sod1;

	@Column(name = "heart_check")
	public Boolean heartCheck;

	@Column(name = "eyes_check")
	public Boolean eyesCheck;

	public Boolean genprofil;

	public String color;

	@Column(name = "studbook_number")
	public String studbookNumber;

	@Column(name = "studbook_number_father")
	public String studbookNumberFather;

	@Column(name = "studbook_number_mother")
	public String studbookNumberMother;

	@Column(columnDefinition = "text")
	public String exhibitions;

	@Column(name = "breed_survey", columnDefinition = "text")
	public String breedSurvey;

	@Column(name = "breeder_kennel_name", length = 500)
	public String breederKennelName;

	static CsvDogSnapshotEntity from(Dog dog, int generation) {
		CsvDogSnapshotEntity entity = new CsvDogSnapshotEntity();
		entity.cId = dog.cId();
		entity.generation = generation;
		entity.givenName = dog.givenName().orElse(null);
		entity.fullKennelName = dog.fullKennelName().orElse(null);
		entity.breederId = dog.breederId().orElse(null);
		entity.ownerId = dog.ownerId().orElse(null);
		entity.chipNumber = dog.chipNumber().orElse(null);
		entity.sex = dog.sex().map(DogSex::name).orElse(null);
		entity.dateOfBirth = dog.dateOfBirth().orElse(null);
		entity.dateOfDeath = dog.dateOfDeath().orElse(null);
		entity.cFertile = dog.cFertile().orElse(null);
		entity.hd = dog.hd().map(DogHd::name).orElse(null);
		entity.sod1 = dog.sod1().map(DogSod1::name).orElse(null);
		entity.heartCheck = dog.heartCheck().orElse(null);
		entity.eyesCheck = dog.eyesCheck().orElse(null);
		entity.genprofil = dog.genprofil().orElse(null);
		entity.color = dog.color().map(DogColor::name).orElse(null);
		entity.studbookNumber = dog.studbookNumber().orElse(null);
		entity.studbookNumberFather = dog.studbookNumberFather().orElse(null);
		entity.studbookNumberMother = dog.studbookNumberMother().orElse(null);
		entity.exhibitions = dog.exhibitions().orElse(null);
		entity.breedSurvey = dog.breedSurvey().orElse(null);
		entity.breederKennelName = dog.breederKennelName().orElse(null);
		return entity;
	}

	Dog toDog() {
		return new Dog(
			cId,
			Optional.ofNullable(givenName),
			Optional.ofNullable(fullKennelName),
			Optional.ofNullable(breederId),
			Optional.ofNullable(ownerId),
			Optional.ofNullable(chipNumber),
			Optional.ofNullable(sex).map(DogSex::valueOf),
			Optional.ofNullable(dateOfBirth),
			Optional.ofNullable(dateOfDeath),
			Optional.ofNullable(cFertile),
			Optional.ofNullable(hd).map(DogHd::valueOf),
			Optional.ofNullable(sod1).map(DogSod1::valueOf),
			Optional.ofNullable(heartCheck),
			Optional.ofNullable(eyesCheck),
			Optional.ofNullable(genprofil),
			Optional.ofNullable(color).map(DogColor::valueOf),
			Optional.ofNullable(studbookNumber),
			Optional.ofNullable(studbookNumberFather),
			Optional.ofNullable(studbookNumberMother),
			Optional.ofNullable(exhibitions),
			Optional.ofNullable(breedSurvey),
			Optional.ofNullable(breederKennelName)
		);
	}
}
