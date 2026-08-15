package de.hzd.importer.domain;

import java.time.LocalDateTime;
import java.util.Optional;

public class AuthentikUser {

    private final Integer cId;
    private final String username;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final boolean active;
    private final LocalDateTime createdAt;

    private AuthentikUser(Builder builder) {
        this.cId = builder.cId;
        this.username = builder.username;
        this.email = builder.email;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.active = builder.active;
        this.createdAt = builder.createdAt;
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

    public Optional<String> getFirstName() {
        return Optional.ofNullable(firstName);
    }

    public Optional<String> getLastName() {
        return Optional.ofNullable(lastName);
    }

    public boolean isActive() {
        return active;
    }

    public Optional<LocalDateTime> getCreatedAt() {
        return Optional.ofNullable(createdAt);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer cId;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private boolean active;
        private LocalDateTime createdAt;

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

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AuthentikUser build() {
            return new AuthentikUser(this);
        }
    }
}