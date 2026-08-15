package de.hzd.importer.domain;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class DogCache {

    private final Map<Integer, Dog> dogsByCId = new HashMap<>();

    public void add(Dog dog) {
        dog.getCId().ifPresent(cId -> dogsByCId.put(cId, dog));
    }

    public void addAll(List<Dog> dogs) {
        dogs.forEach(this::add);
    }

    public Optional<Dog> findByCId(Integer cId) {
        return Optional.ofNullable(dogsByCId.get(cId));
    }

    public List<Dog> getAll() {
        return new ArrayList<>(dogsByCId.values());
    }

    public int size() {
        return dogsByCId.size();
    }

    public void clear() {
        dogsByCId.clear();
    }
}
