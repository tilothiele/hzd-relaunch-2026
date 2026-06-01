package de.hzd.importer.domain;

import java.time.LocalDate;
import java.util.Optional;

public record Dog(
		int cId,
		Optional<String> givenName,
		Optional<String> fullKennelName,
		Optional<Integer> breederId,
		Optional<Integer> ownerId,
		Optional<String> chipNumber,
		Optional<DogSex> sex,
		Optional<LocalDate> dateOfBirth,
		Optional<LocalDate> dateOfDeath,
		Optional<Boolean> cFertile,
		Optional<DogHd> hd,
		Optional<DogSod1> sod1,
		Optional<Boolean> heartCheck,
		Optional<Boolean> eyesCheck,
		Optional<Boolean> genprofil,
		Optional<DogColor> color,
		Optional<String> studbookNumber,
		Optional<String> studbookNumberFather,
		Optional<String> studbookNumberMother,
		Optional<String> exhibitions,
		Optional<String> breedSurvey,
		Optional<String> breederKennelName
) {
}
