package de.hzd.importer.domain;

import java.time.LocalDate;
import java.util.Optional;

public class Breeder {

    private final Integer cId;
    private final BreederRole breederRole;
    private final String kennelName;
    private final LocalDate breedingLicenseSince;
    private final Integer memberCId;

    private Breeder(Builder builder) {
        this.cId = builder.cId;
        this.breederRole = builder.breederRole;
        this.kennelName = builder.kennelName;
        this.breedingLicenseSince = builder.breedingLicenseSince;
        this.memberCId = builder.memberCId;
    }

    public Optional<Integer> getCId() {
        return Optional.ofNullable(cId);
    }

    public Optional<BreederRole> getBreederRole() {
        return Optional.ofNullable(breederRole);
    }

    public Optional<String> getKennelName() {
        return Optional.ofNullable(kennelName);
    }

    public Optional<LocalDate> getBreedingLicenseSince() {
        return Optional.ofNullable(breedingLicenseSince);
    }

    public Optional<Integer> getMemberCId() {
        return Optional.ofNullable(memberCId);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer cId;
        private BreederRole breederRole;
        private String kennelName;
        private LocalDate breedingLicenseSince;
        private Integer memberCId;

        public Builder cId(Integer cId) {
            this.cId = cId;
            return this;
        }

        public Builder breederRole(BreederRole breederRole) {
            this.breederRole = breederRole;
            return this;
        }

        public Builder kennelName(String kennelName) {
            this.kennelName = kennelName;
            return this;
        }

        public Builder breedingLicenseSince(LocalDate breedingLicenseSince) {
            this.breedingLicenseSince = breedingLicenseSince;
            return this;
        }

        public Builder memberCId(Integer memberCId) {
            this.memberCId = memberCId;
            return this;
        }

        public Breeder build() {
            return new Breeder(this);
        }
    }
}
