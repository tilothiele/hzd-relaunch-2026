package de.hzd.importer.domain;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class AuthentikUserCache {

    private final Map<Integer, AuthentikUser> usersByCId = new HashMap<>();
    private final Map<String, AuthentikUser> usersByUsername = new HashMap<>();

    public void add(AuthentikUser user) {
        user.getCId().ifPresent(cId -> usersByCId.put(cId, user));
        user.getUsername().ifPresent(username -> usersByUsername.put(username, user));
    }

    public void addAll(List<AuthentikUser> users) {
        users.forEach(this::add);
    }

    public Optional<AuthentikUser> findByCId(Integer cId) {
        return Optional.ofNullable(usersByCId.get(cId));
    }

    public Optional<AuthentikUser> findByUsername(String username) {
        return Optional.ofNullable(usersByUsername.get(username));
    }

    public List<AuthentikUser> getAll() {
        return new ArrayList<>(usersByCId.values());
    }

    public int size() {
        return usersByCId.size();
    }

    public void clear() {
        usersByCId.clear();
        usersByUsername.clear();
    }
}