package de.hzd.importer.domain;

import java.time.LocalDate;
import java.util.Optional;

public class StrapiUser {

    private final Integer cId;
    private final String username;
    private final String email;
    private final UserSex sex;
    private final String title;
    private final String firstName;
    private final String lastName;
    private final String address1;
    private final String zip;
    private final String city;
    private final UserRegion region;
    private final String countryCode;
    private final String phone;
    private final boolean breeder;
    private final Integer membershipNumber;
    private final LocalDate dateOfBirth;
    private final LocalDate dateOfDeath;
    private final LocalDate memberSince;
    private final LocalDate cancellationOn;

    private StrapiUser(Builder builder) {
        this.cId = builder.cId;
        this.username = builder.username;
        this.email = builder.email;
        this.sex = builder.sex;
        this.title = builder.title;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.address1 = builder.address1;
        this.zip = builder.zip;
        this.city = builder.city;
        this.region = builder.region;
        this.countryCode = builder.countryCode;
        this.phone = builder.phone;
        this.breeder = builder.breeder;
        this.membershipNumber = builder.membershipNumber;
        this.dateOfBirth = builder.dateOfBirth;
        this.dateOfDeath = builder.dateOfDeath;
        this.memberSince = builder.memberSince;
        this.cancellationOn = builder.cancellationOn;
    }

    public Optional<Integer> getCId() {
        return Optional.ofNullable(cId);
    }

    public Optional<String> getUsername() {
        return Optional.ofNullable(username);
    }

    public Optional<String> getEmail() {
        return Optional.ofNullable(email);
    }

    public Optional<UserSex> getSex() {
        return Optional.ofNullable(sex);
    }

    public Optional<String> getTitle() {
        return Optional.ofNullable(title);
    }

    public Optional<String> getFirstName() {
        return Optional.ofNullable(firstName);
    }

    public Optional<String> getLastName() {
        return Optional.ofNullable(lastName);
    }

    public Optional<String> getAddress1() {
        return Optional.ofNullable(address1);
    }

    public Optional<String> getZip() {
        return Optional.ofNullable(zip);
    }

    public Optional<String> getCity() {
        return Optional.ofNullable(city);
    }

    public Optional<UserRegion> getRegion() {
        return Optional.ofNullable(region);
    }

    public Optional<String> getCountryCode() {
        return Optional.ofNullable(countryCode);
    }

    public Optional<String> getPhone() {
        return Optional.ofNullable(phone);
    }

    public boolean isBreeder() {
        return breeder;
    }

    public Optional<Integer> getMembershipNumber() {
        return Optional.ofNullable(membershipNumber);
    }

    public Optional<LocalDate> getDateOfBirth() {
        return Optional.ofNullable(dateOfBirth);
    }

    public Optional<LocalDate> getDateOfDeath() {
        return Optional.ofNullable(dateOfDeath);
    }

    public Optional<LocalDate> getMemberSince() {
        return Optional.ofNullable(memberSince);
    }

    public Optional<LocalDate> getCancellationOn() {
        return Optional.ofNullable(cancellationOn);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer cId;
        private String username;
        private String email;
        private UserSex sex;
        private String title;
        private String firstName;
        private String lastName;
        private String address1;
        private String zip;
        private String city;
        private UserRegion region;
        private String countryCode;
        private String phone;
        private boolean breeder;
        private Integer membershipNumber;
        private LocalDate dateOfBirth;
        private LocalDate dateOfDeath;
        private LocalDate memberSince;
        private LocalDate cancellationOn;

        public Builder cId(Integer cId) {
            this.cId = cId;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder sex(UserSex sex) {
            this.sex = sex;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder address1(String address1) {
            this.address1 = address1;
            return this;
        }

        public Builder zip(String zip) {
            this.zip = zip;
            return this;
        }

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder region(UserRegion region) {
            this.region = region;
            return this;
        }

        public Builder countryCode(String countryCode) {
            this.countryCode = countryCode;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder breeder(boolean breeder) {
            this.breeder = breeder;
            return this;
        }

        public Builder membershipNumber(Integer membershipNumber) {
            this.membershipNumber = membershipNumber;
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

        public Builder memberSince(LocalDate memberSince) {
            this.memberSince = memberSince;
            return this;
        }

        public Builder cancellationOn(LocalDate cancellationOn) {
            this.cancellationOn = cancellationOn;
            return this;
        }

        public StrapiUser build() {
            return new StrapiUser(this);
        }
    }
}