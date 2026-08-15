package de.hzd.importer.domain;

import java.time.LocalDate;
import java.util.Optional;

public class Dog {

    private final Integer cId;
    private final String givenName;
    private final String fullKennelName;
    private final Integer breederCId;
    private final Integer ownerCId;
    private final String microchipNo;
    private final DogSex sex;
    private final LocalDate dateOfBirth;
    private final LocalDate dateOfDeath;
    private final DogHd hd;
    private final DogSod1 sod1;
    private final DogColor color;
    private final boolean eyesCheck;
    private final boolean heartCheck;
    private final String exhibitions;
    private final String breedSurvey;

    private Dog(Builder builder) {
        this.cId = builder.cId;
        this.givenName = builder.givenName;
        this.fullKennelName = builder.fullKennelName;
        this.breederCId = builder.breederCId;
        this.ownerCId = builder.ownerCId;
        this.microchipNo = builder.microchipNo;
        this.sex = builder.sex;
        this.dateOfBirth = builder.dateOfBirth;
        this.dateOfDeath = builder.dateOfDeath;
        this.hd = builder.hd;
        this.sod1 = builder.sod1;
        this.color = builder.color;
        this.eyesCheck = builder.eyesCheck;
        this.heartCheck = builder.heartCheck;
        this.exhibitions = builder.exhibitions;
        this.breedSurvey = builder.breedSurvey;
    }

    public Optional<Integer> getCId() {
        return Optional.ofNullable(cId);
    }

    public Optional<String> getGivenName() {
        return Optional.ofNullable(givenName);
    }

    public Optional<String> getFullKennelName() {
        return Optional.ofNullable(fullKennelName);
    }

    public Optional<Integer> getBreederCId() {
        return Optional.ofNullable(breederCId);
    }

    public Optional<Integer> getOwnerCId() {
        return Optional.ofNullable(ownerCId);
    }

    public Optional<String> getMicrochipNo() {
        return Optional.ofNullable(microchipNo);
    }

    public Optional<DogSex> getSex() {
        return Optional.ofNullable(sex);
    }

    public Optional<LocalDate> getDateOfBirth() {
        return Optional.ofNullable(dateOfBirth);
    }

    public Optional<LocalDate> getDateOfDeath() {
        return Optional.ofNullable(dateOfDeath);
    }

    public Optional<DogHd> getHd() {
        return Optional.ofNullable(hd);
    }

    public Optional<DogSod1> getSod1() {
        return Optional.ofNullable(sod1);
    }

    public Optional<DogColor> getColor() {
        return Optional.ofNullable(color);
    }

    public boolean hasEyesCheck() {
        return eyesCheck;
    }

    public boolean hasHeartCheck() {
        return heartCheck;
    }

    public Optional<String> getExhibitions() {
        return Optional.ofNullable(exhibitions);
    }

    public Optional<String> getBreedSurvey() {
        return Optional.ofNullable(breedSurvey);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer cId;
        private String givenName;
        private String fullKennelName;
        private Integer breederCId;
        private Integer ownerCId;
        private String microchipNo;
        private DogSex sex;
        private LocalDate dateOfBirth;
        private LocalDate dateOfDeath;
        private DogHd hd;
        private DogSod1 sod1;
        private DogColor color;
        private boolean eyesCheck;
        private boolean heartCheck;
        private String exhibitions;
        private String breedSurvey;

        public Builder cId(Integer cId) {
            this.cId = cId;
            return this;
        }

        public Builder givenName(String givenName) {
            this.givenName = givenName;
            return this;
        }

        public Builder fullKennelName(String fullKennelName) {
            this.fullKennelName = fullKennelName;
            return this;
        }

        public Builder breederCId(Integer breederCId) {
            this.breederCId = breederCId;
            return this;
        }

        public Builder ownerCId(Integer ownerCId) {
            this.ownerCId = ownerCId;
            return this;
        }

        public Builder microchipNo(String microchipNo) {
            this.microchipNo = microchipNo;
            return this;
        }

        public Builder sex(DogSex sex) {
            this.sex = sex;
            return this;
        }

        public Builder dateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
            return this;
        }

        public Builder dateOfDeath(LocalDate dateOfDeath) {
            this.dateOfDeath = dateOfDeath;
            return this;
        }

        public Builder hd(DogHd hd) {
            this.hd = hd;
            return this;
        }

        public Builder sod1(DogSod1 sod1) {
            this.sod1 = sod1;
            return this;
        }

        public Builder color(DogColor color) {
            this.color = color;
            return this;
        }

        public Builder eyesCheck(boolean eyesCheck) {
            this.eyesCheck = eyesCheck;
            return this;
        }

        public Builder heartCheck(boolean heartCheck) {
            this.heartCheck = heartCheck;
            return this;
        }

        public Builder exhibitions(String exhibitions) {
            this.exhibitions = exhibitions;
            return this;
        }

        public Builder breedSurvey(String breedSurvey) {
            this.breedSurvey = breedSurvey;
            return this;
        }

        public Dog build() {
            return new Dog(this);
        }
    }
}
