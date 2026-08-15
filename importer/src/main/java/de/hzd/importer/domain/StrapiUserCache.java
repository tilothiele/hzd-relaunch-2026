package de.hzd.importer.domain;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class StrapiUserCache {

    private final Map<Integer, StrapiUser> usersByCId = new HashMap<>();

    public void add(StrapiUser user) {
        user.getCId().ifPresent(cId -> usersByCId.put(cId, user));
    }

    public void addAll(List<StrapiUser> users) {
        users.forEach(this::add);
    }

    public Optional<StrapiUser> findByCId(Integer cId) {
        return Optional.ofNullable(usersByCId.get(cId));
    }

    public List<StrapiUser> getAll() {
        return new ArrayList<>(usersByCId.values());
    }

    public int size() {
        return usersByCId.size();
    }

    public void clear() {
        usersByCId.clear();
    }
}