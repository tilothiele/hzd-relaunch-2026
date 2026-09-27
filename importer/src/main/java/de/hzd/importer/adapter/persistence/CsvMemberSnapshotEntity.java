package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.Member;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.domain.UserSex;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.Optional;

@Entity
@Table(name = "csv_members")
@IdClass(CsvSnapshotId.class)
public class CsvMemberSnapshotEntity extends PanacheEntityBase {

	@Id
	@Column(name = "c_id", nullable = false)
	public int cId;

	@Id
	@Column(nullable = false)
	public int generation;

	@Column(name = "c_flag_access")
	public Boolean cFlagAccess;

	public String title;

	@Column(name = "first_name")
	public String firstName;

	@Column(name = "last_name")
	public String lastName;

	public String address1;

	public String zip;

	public String city;

	public String region;

	@Column(name = "country_code")
	public String countryCode;

	public String phone;

	public String email;

	public String sex;

	@Column(name = "c_flag_breeder")
	public Boolean cFlagBreeder;

	@Column(name = "membership_number")
	public Integer membershipNumber;

	@Column(name = "breeding_station")
	public String breedingStation;

	@Column(name = "date_of_birth")
	public LocalDate dateOfBirth;

	@Column(name = "date_of_death")
	public LocalDate dateOfDeath;

	@Column(name = "member_since")
	public LocalDate memberSince;

	@Column(name = "cancellation_on")
	public LocalDate cancellationOn;

	@Column(name = "is_active_breeder")
	public Boolean isActiveBreeder;

	static CsvMemberSnapshotEntity from(Member member, int generation) {
		CsvMemberSnapshotEntity entity = new CsvMemberSnapshotEntity();
		entity.cId = member.cId();
		entity.generation = generation;
		entity.cFlagAccess = member.cFlagAccess().orElse(null);
		entity.title = member.title().orElse(null);
		entity.firstName = member.firstName().orElse(null);
		entity.lastName = member.lastName().orElse(null);
		entity.address1 = member.address1().orElse(null);
		entity.zip = member.zip().orElse(null);
		entity.city = member.city().orElse(null);
		entity.region = member.region().map(UserRegion::name).orElse(null);
		entity.countryCode = member.countryCode().orElse(null);
		entity.phone = member.phone().orElse(null);
		entity.email = member.email().orElse(null);
		entity.sex = member.sex().map(UserSex::name).orElse(null);
		entity.cFlagBreeder = member.cFlagBreeder().orElse(null);
		entity.membershipNumber = member.membershipNumber().orElse(null);
		entity.breedingStation = member.breedingStation().orElse(null);
		entity.dateOfBirth = member.dateOfBirth().orElse(null);
		entity.dateOfDeath = member.dateOfDeath().orElse(null);
		entity.memberSince = member.memberSince().orElse(null);
		entity.cancellationOn = member.cancellationOn().orElse(null);
		entity.isActiveBreeder = member.isActiveBreeder().orElse(null);
		return entity;
	}

	Member toMember() {
		return new Member(
			cId,
			Optional.ofNullable(cFlagAccess),
			Optional.ofNullable(title),
			Optional.ofNullable(firstName),
			Optional.ofNullable(lastName),
			Optional.ofNullable(address1),
			Optional.ofNullable(zip),
			Optional.ofNullable(city),
			Optional.ofNullable(region).map(UserRegion::valueOf),
			Optional.ofNullable(countryCode),
			Optional.ofNullable(phone),
			Optional.ofNullable(email),
			Optional.ofNullable(sex).map(UserSex::valueOf),
			Optional.ofNullable(cFlagBreeder),
			Optional.ofNullable(membershipNumber),
			Optional.ofNullable(breedingStation),
			Optional.ofNullable(dateOfBirth),
			Optional.ofNullable(dateOfDeath),
			Optional.ofNullable(memberSince),
			Optional.ofNullable(cancellationOn),
			Optional.ofNullable(isActiveBreeder),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);
	}
}
